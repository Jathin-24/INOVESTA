'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, Send, CheckCircle2, Loader2, FileText, Users, Info, ChevronRight } from 'lucide-react'

export default function Home() {
    const [formData, setFormData] = useState({
        teamName: '',
        leaderName: '',
    })
    const [pptFile, setPptFile] = useState(null)
    const [otherFiles, setOtherFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [message, setMessage] = useState('')

    const guidelines = [
        "Proper Problem Statement",
        "Existing Solutions & Limitations",
        "Proposed Solution & Advantages",
        "Project Architecture",
        "Designs of the Project Model",
        "Estimated Budget",
        "Business Model (Revenue/Strategy)",
        "Future Scope"
    ]

    const handleFileChange = (e, type) => {
        if (type === 'ppt') {
            setPptFile(e.target.files[0])
        } else {
            setOtherFiles(Array.from(e.target.files))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!pptFile) return alert('PPT is mandatory! Please upload your presentation.')

        setUploading(true)
        setMessage('Uploading innovation...')

        try {
            // 1. Upload PPT
            const pptExt = pptFile.name.split('.').pop()
            const pptPath = `${Date.now()}_${formData.teamName}_PPT.${pptExt}`
            const { error: pptError } = await supabase.storage
                .from('submissions')
                .upload(pptPath, pptFile)

            if (pptError) throw pptError

            // 2. Upload Other Files (Design, Reports)
            const otherFilesUrls = []
            for (const file of otherFiles) {
                const path = `${Date.now()}_${formData.teamName}_DOC_${file.name}`
                const { error: fileError } = await supabase.storage
                    .from('submissions')
                    .upload(path, file)

                if (fileError) throw fileError
                otherFilesUrls.push(path)
            }

            // 3. Store Submission
            const { error: dbError } = await supabase
                .from('submissions')
                .insert([{
                    team_name: formData.teamName,
                    leader_name: formData.leaderName,
                    ppt_url: pptPath,
                    other_files_urls: otherFilesUrls,
                    status: 'pending'
                }])

            if (dbError) throw dbError

            setSubmitted(true)
        } catch (error) {
            console.error(error)
            alert('Submission Error: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    if (submitted) {
        return (
            <main className="flex min-h-screen items-center justify-center p-8 bg-black">
                <div className="glass-card p-12 text-center max-w-lg w-full animate-in fade-in zoom-in duration-500">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h1 className="text-4xl font-bold mb-4 premium-gradient-text">Success!</h1>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        Your project <span className="text-white font-semibold">"{formData.teamName}"</span> has been successfully submitted for INOVESTA 2026.
                    </p>
                    <button onClick={() => window.location.reload()} className="premium-button text-white font-bold py-3 px-8 rounded-lg shadow-lg">
                        Submit Another
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-black text-white p-8 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                {/* Guidelines Sidebar */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="glass-card p-8 border-l-4 border-l-blue-500">
                        <div className="flex items-center gap-3 mb-6">
                            <Info className="text-blue-500 w-8 h-8" />
                            <h2 className="text-3xl font-bold">Presentation Guidelines</h2>
                        </div>
                        <ul className="space-y-4">
                            {guidelines.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 group">
                                    <ChevronRight className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                                    <span className="text-gray-300 leading-relaxed font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-10 p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-blue-400 mb-2">Notice</h4>
                            <p className="text-sm text-gray-400 italic leading-relaxed">
                                Adherence to these guidelines is mandatory for your presentation tomorrow. Best of luck!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submission Form */}
                <div className="lg:col-span-7">
                    <div className="glass-card p-10">
                        <div className="mb-10">
                            <h1 className="text-4xl font-black mb-2 premium-gradient-text uppercase">Submit Innovation</h1>
                            <p className="text-gray-400">Team INOVESTA 2026 Submission Portal</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Team Name</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                                        <input
                                            required
                                            type="text"
                                            placeholder="e.g. InnovateX"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                                            value={formData.teamName}
                                            onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Leader Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                                        value={formData.leaderName}
                                        onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-white/10">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-3">
                                        Main Presentation (PPT/PPTX) <span className="text-red-500">*Mandatory</span>
                                    </label>
                                    <div className="relative group">
                                        <input required type="file" accept=".ppt,.pptx" id="ppt-file" className="hidden" onChange={(e) => handleFileChange(e, 'ppt')} />
                                        <label htmlFor="ppt-file" className="flex items-center gap-4 border-2 border-dashed border-white/10 rounded-2xl p-8 cursor-pointer hover:border-blue-500/50 hover:bg-white/5 transition-all text-gray-400 text-center">
                                            <div className="p-3 bg-blue-500/10 rounded-lg"><FileText className="text-blue-500" /></div>
                                            <span className="font-medium">{pptFile ? pptFile.name : "Click to upload PowerPoint"}</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-3">
                                        Additional Files (Design File, Project Report, etc.)
                                    </label>
                                    <div className="relative group">
                                        <input type="file" multiple id="others" className="hidden" onChange={(e) => handleFileChange(e, 'other')} />
                                        <label htmlFor="others" className="flex items-center gap-4 border-2 border-dashed border-white/10 rounded-2xl p-8 cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition-all text-gray-400">
                                            <div className="p-3 bg-purple-500/10 rounded-lg"><Upload className="text-purple-500" /></div>
                                            <span className="font-medium">
                                                {otherFiles.length > 0 ? `${otherFiles.length} files selected` : "Upload Design Files / Reports"}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full premium-button text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all text-lg tracking-widest group"
                            >
                                {uploading ? (
                                    <><Loader2 className="animate-spin" /> {message}</>
                                ) : (
                                    <><Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> SUBMIT NOW</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    )
}
