'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Download, Check, ExternalLink, Users, FileText, Loader2, RefreshCcw, Layers, Presentation } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export default function AdminDashboard() {
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [opStatus, setOpStatus] = useState('') // 'all', 'ppt', 'others', ''

    const fetchSubmissions = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('submissions')
                .select('*')
                .order('serial_number', { ascending: true })

            if (error) {
                console.error('Error fetching data:', error)
                alert('Error loading submissions.')
            } else {
                setSubmissions(data)
            }
        } catch (err) {
            console.error('Exception:', err)
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

        if (error) return alert('Error updating status.')

        const { data: publicUrl } = supabase.storage
            .from('submissions')
            .getPublicUrl(submission.ppt_url)

        window.open(publicUrl.publicUrl, '_blank')
        fetchSubmissions()
    }

    const downloadZipped = async (mode) => {
        const acceptedOnly = submissions.filter(s => s.status === 'accepted')
        if (acceptedOnly.length === 0) return alert('No accepted projects to download.')

        setOpStatus(mode)
        const zip = new JSZip()

        try {
            for (let i = 0; i < acceptedOnly.length; i++) {
                const sub = acceptedOnly[i]
                const folderName = `${i + 1}_${sub.team_name}_${sub.leader_name}`.replace(/[^a-z0-9_]/gi, '_')
                const folder = zip.folder(folderName)

                // 1. PPT Download
                if (mode === 'all' || mode === 'ppt') {
                    const { data: pptBlob, error: pptErr } = await supabase.storage.from('submissions').download(sub.ppt_url)
                    if (!pptErr) {
                        const fileName = sub.ppt_url.split('_').slice(2).join('_')
                        folder.file(`PPT_${fileName}`, pptBlob)
                    }
                }

                // 2. Others Download
                if (mode === 'all' || mode === 'others') {
                    for (const fileUrl of (sub.other_files_urls || [])) {
                        const { data: fileBlob, error: fileErr } = await supabase.storage.from('submissions').download(fileUrl)
                        if (!fileErr) {
                            const fileName = fileUrl.split('_').slice(2).join('_')
                            folder.file(`File_${fileName}`, fileBlob)
                        }
                    }
                }
            }

            const content = await zip.generateAsync({ type: 'blob' })
            const suffix = mode === 'ppt' ? 'Presentation_Files' : mode === 'others' ? 'Project_Docs' : 'All_Submission_Files'
            saveAs(content, `INOVESTA_2026_${suffix}.zip`)
        } catch (err) {
            alert('Error creating zip file.')
        } finally {
            setOpStatus('')
        }
    }

    return (
        <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-6 lg:p-16">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 border-b border-neutral-100 dark:border-neutral-900 pb-10">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase">Admin Dashboard</h1>
                        <p className="text-neutral-500 font-medium">Manage and download event projects</p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button onClick={fetchSubmissions} className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-all">
                            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            disabled={!!opStatus}
                            onClick={() => downloadZipped('ppt')}
                            className="formal-button-outline text-sm font-bold uppercase tracking-wider disabled:opacity-30"
                        >
                            {opStatus === 'ppt' ? <Loader2 className="animate-spin" /> : 'Download PPTs'}
                        </button>

                        <button
                            disabled={!!opStatus}
                            onClick={() => downloadZipped('others')}
                            className="formal-button-outline text-sm font-bold uppercase tracking-wider disabled:opacity-30"
                        >
                            {opStatus === 'others' ? <Loader2 className="animate-spin" /> : 'Download Files'}
                        </button>

                        <button
                            disabled={!!opStatus}
                            onClick={() => downloadZipped('all')}
                            className="formal-button text-sm uppercase tracking-wider"
                        >
                            {opStatus === 'all' ? <Loader2 className="animate-spin" /> : 'Download All'}
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="border border-neutral-100 dark:border-neutral-900 p-6 rounded-lg bg-neutral-50 dark:bg-neutral-950/50">
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">Total Signals</p>
                        <h4 className="text-3xl font-bold">{submissions.length}</h4>
                    </div>
                    <div className="border border-neutral-100 dark:border-neutral-900 p-6 rounded-lg bg-neutral-50 dark:bg-neutral-950/50">
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">Accepted</p>
                        <h4 className="text-3xl font-bold text-green-600 dark:text-green-500">
                            {submissions.filter(s => s.status === 'accepted').length}
                        </h4>
                    </div>
                    <div className="border border-neutral-100 dark:border-neutral-900 p-6 rounded-lg bg-neutral-50 dark:bg-neutral-950/50">
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">Pending</p>
                        <h4 className="text-3xl font-bold text-neutral-400">
                            {submissions.filter(s => s.status === 'pending').length}
                        </h4>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-neutral-400" />
                        <span className="text-neutral-400 font-bold uppercase tracking-widest text-xs">Loading Data...</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {submissions.map((sub, index) => (
                            <div key={sub.id} className={`formal-card p-6 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all ${sub.status === 'accepted' ? 'bg-neutral-50 dark:bg-neutral-950/30' : ''}`}>
                                <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
                                    <div className="w-12 h-12 border border-neutral-100 dark:border-neutral-900 rounded bg-white dark:bg-black flex items-center justify-center text-lg font-bold text-neutral-400">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div className="text-center md:text-left space-y-1">
                                        <div className="flex items-center justify-center md:justify-start gap-3">
                                            <h3 className="text-xl font-bold tracking-tight">{sub.team_name}</h3>
                                            {sub.status === 'accepted' && <Check className="w-5 h-5 text-green-500" />}
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-4">
                                            <span className="flex items-center gap-1.5 text-neutral-500 font-medium text-sm">
                                                <Users className="w-3 h-3" /> {sub.leader_name}
                                            </span>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded">
                                                ID: {sub.id.slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-8 w-full md:w-auto justify-end border-t md:border-t-0 border-neutral-100 dark:border-neutral-900 pt-6 md:pt-0">
                                    <div className="flex gap-8 text-neutral-400">
                                        <div className="text-center">
                                            <Presentation className="w-5 h-5 mx-auto mb-1 opacity-40" />
                                            <p className="text-[8px] font-bold uppercase tracking-widest">PPT</p>
                                        </div>
                                        <div className="text-center">
                                            <Layers className="w-5 h-5 mx-auto mb-1 opacity-40" />
                                            <p className="text-[8px] font-bold uppercase tracking-widest">Docs ({sub.other_files_urls?.length || 0})</p>
                                        </div>
                                    </div>

                                    {sub.status === 'pending' ? (
                                        <button
                                            onClick={() => handleAccept(sub)}
                                            className="w-full sm:w-auto formal-button py-3 text-sm px-8"
                                        >
                                            Accept Project
                                        </button>
                                    ) : (
                                        <div className="w-full sm:w-auto text-green-600 dark:text-green-500 font-bold uppercase text-xs tracking-widest px-8 flex items-center gap-2">
                                            Verified Asset
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {submissions.length === 0 && (
                            <div className="text-center py-32 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                                <FileText className="w-12 h-12 text-neutral-200 dark:text-neutral-800 mx-auto mb-4" />
                                <p className="text-neutral-400 text-sm font-medium uppercase tracking-widest">No submissions found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
