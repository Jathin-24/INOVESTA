'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Download, Check, ExternalLink, Users, FileText, Loader2, RefreshCcw, Layers, Presentation } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default function AdminDashboard() {
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [opStatus, setOpStatus] = useState('') // 'downloading_all', 'downloading_ppt', 'downloading_others', ''

    const fetchSubmissions = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('submissions')
                .select('*')
                .order('serial_number', { ascending: true })

            if (error) {
                console.error('Supabase Error:', error)
                alert(`Error: ${error.message}\nCode: ${error.code}`)
            } else {
                setSubmissions(data)
            }
        } catch (err) {
            console.error('Fetch Exception:', err)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSubmissions()
    }, [])

    const handleAccept = async (submission) => {
        const { error } = await supabase
            .from('submissions')
            .update({ status: 'accepted' })
            .eq('id', submission.id)

        if (error) return alert('Error updating status')

        const { data: publicUrl } = supabase.storage
            .from('submissions')
            .getPublicUrl(submission.ppt_url)

        window.open(publicUrl.publicUrl, '_blank')
        fetchSubmissions()
    }

    const downloadZipped = async (mode) => {
        const acceptedOnly = submissions.filter(s => s.status === 'accepted')
        if (acceptedOnly.length === 0) return alert('No accepted submissions to download')

        setOpStatus(mode)
        const zip = new JSZip()

        try {
            for (let i = 0; i < acceptedOnly.length; i++) {
                const sub = acceptedOnly[i]
                const folderName = `${i + 1}_${sub.team_name}_${sub.leader_name}`.replace(/[^a-z0-9_]/gi, '_')
                const folder = zip.folder(folderName)

                // 1. PPT Download (Included if mode is 'all' or 'ppt')
                if (mode === 'all' || mode === 'ppt') {
                    const { data: pptBlob, error: pptErr } = await supabase.storage.from('submissions').download(sub.ppt_url)
                    if (!pptErr) {
                        const fileName = sub.ppt_url.split('_').slice(2).join('_')
                        folder.file(`MAIN_PRESENTATION_${fileName}`, pptBlob)
                    }
                }

                // 2. Others Download (Included if mode is 'all' or 'others')
                if (mode === 'all' || mode === 'others') {
                    for (const fileUrl of (sub.other_files_urls || [])) {
                        const { data: fileBlob, error: fileErr } = await supabase.storage.from('submissions').download(fileUrl)
                        if (!fileErr) {
                            const fileName = fileUrl.split('_').slice(2).join('_')
                            folder.file(`SUPPORTING_${fileName}`, fileBlob)
                        }
                    }
                }
            }

            const content = await zip.generateAsync({ type: 'blob' })
            const suffix = mode === 'ppt' ? 'PPTs_Only' : mode === 'others' ? 'Others_Only' : 'Complete'
            saveAs(content, `INOVESTA_2026_${suffix}.zip`)
        } catch (err) {
            console.error(err)
            alert('Error creating zip')
        } finally {
            setOpStatus('')
        }
    }

    return (
        <main className="min-h-screen bg-black text-white p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <div>
                        <h1 className="text-5xl font-black premium-gradient-text tracking-tighter uppercase">Admin Panel</h1>
                        <p className="text-gray-400 mt-2 text-lg">Event INOVESTA 2026 Submission Control</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button onClick={fetchSubmissions} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                            <RefreshCcw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            disabled={!!opStatus}
                            onClick={() => downloadZipped('ppt')}
                            className="bg-blue-600/10 border border-blue-500/20 text-blue-400 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                        >
                            {opStatus === 'ppt' ? <Loader2 className="animate-spin" /> : <Presentation className="w-5 h-5" />}
                            PPTs Only
                        </button>

                        <button
                            disabled={!!opStatus}
                            onClick={() => downloadZipped('others')}
                            className="bg-purple-600/10 border border-purple-500/20 text-purple-400 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50"
                        >
                            {opStatus === 'others' ? <Loader2 className="animate-spin" /> : <Layers className="w-5 h-5" />}
                            Docs Only
                        </button>

                        <button
                            disabled={!!opStatus}
                            onClick={() => downloadZipped('all')}
                            className="premium-button px-8 py-4 rounded-2xl font-black text-white shadow-xl shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                        >
                            {opStatus === 'all' ? <Loader2 className="animate-spin" /> : <Download className="w-6 h-6" />}
                            Download All
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-40 gap-4">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                        <span className="text-gray-400 font-bold animate-pulse">Syncing Submissions...</span>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {submissions.map((sub, index) => (
                            <div key={sub.id} className={`glass-card p-8 flex flex-col lg:flex-row items-center justify-between gap-8 transition-all hover:border-white/20 ${sub.status === 'accepted' ? 'bg-green-500/5' : ''}`}>
                                <div className="flex gap-8 items-center w-full lg:w-auto">
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-gray-500">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                            {sub.team_name}
                                            {sub.status === 'accepted' && <Check className="w-6 h-6 text-green-500" />}
                                        </h3>
                                        <div className="flex gap-6 mt-2">
                                            <span className="flex items-center gap-2 text-gray-400 font-medium">
                                                <Users className="w-4 h-4 text-blue-500" /> {sub.leader_name}
                                            </span>
                                            <span className="bg-white/5 px-3 py-1 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-widest border border-white/5">
                                                ID: {sub.id.slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/5 pt-6 lg:pt-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-gray-500 uppercase tracking-tighter">Files Stats</p>
                                        <div className="flex gap-4">
                                            <span className="text-blue-500 text-sm font-bold flex items-center gap-1"><Presentation className="w-3 h-3" /> 1 PPT</span>
                                            <span className="text-purple-500 text-sm font-bold flex items-center gap-1"><Layers className="w-3 h-3" /> {sub.other_files_urls?.length || 0} Docs</span>
                                        </div>
                                    </div>

                                    {sub.status === 'pending' ? (
                                        <button
                                            onClick={() => handleAccept(sub)}
                                            className="bg-white text-black hover:bg-blue-500 hover:text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-2 shadow-lg"
                                        >
                                            Accept & Verify
                                            <ExternalLink className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <div className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black border border-green-400 flex items-center gap-2">
                                            Verified
                                            <Check className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {submissions.length === 0 && (
                            <div className="text-center py-40 border-2 border-dashed border-white/10 rounded-[40px] bg-white/[0.02]">
                                <FileText className="w-24 h-24 text-gray-800 mx-auto mb-6" />
                                <p className="text-gray-500 text-2xl font-black uppercase tracking-widest">Awaiting Innovations</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
