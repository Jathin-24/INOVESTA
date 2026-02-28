'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, Send, CheckCircle2, Loader2, FileText, Users, Info, ChevronRight } from 'lucide-react'

export default function Home() {
    const [formData, setFormData] = useState({
        teamName: '',
        leaderName: '',
        teamNumber: '',
    })
    const [pptFile, setPptFile] = useState(null)
    const [otherFiles, setOtherFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const guidelines = [
        "Proper Problem Statement",
        "Existing Solutions & Limitations",
        "Proposed Solution & Advantages",
        "Project Architecture",
        "Designs of the Project Model",
        "Estimated Budget",
        "Business Model (How it works)",
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
        if (!pptFile) return alert('Please upload your PPT file.')

        // Format check: NSC followed by 2 digits
        const teamNumRegex = /^NSC\d{2}$/
        if (!teamNumRegex.test(formData.teamNumber)) {
            return alert('Team Number must be in NSC00 format (e.g., NSC01, NSC12)')
        }

        setUploading(true)

        try {
            const pptExt = pptFile.name.split('.').pop()
            const pptPath = `${Date.now()}_${formData.teamNumber}_${formData.teamName}_PPT.${pptExt}`
            const { error: pptError } = await supabase.storage.from('submissions').upload(pptPath, pptFile)
            if (pptError) throw pptError

            const otherFilesUrls = []
            for (const file of otherFiles) {
                const path = `${Date.now()}_${formData.teamNumber}_${formData.teamName}_File_${file.name}`
                const { error: fileError } = await supabase.storage.from('submissions').upload(path, file)
                if (fileError) throw fileError
                otherFilesUrls.push(path)
            }

            const { error: dbError } = await supabase.from('submissions').insert([{
                team_name: formData.teamName,
                leader_name: formData.leaderName,
                team_number: formData.teamNumber,
                ppt_url: pptPath,
                other_files_urls: otherFilesUrls,
                status: 'pending'
            }])

            if (dbError) throw dbError
            setSubmitted(true)
        } catch (error) {
            alert('Error: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    if (submitted) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6 bg-white dark:bg-black">
                <div className="formal-card text-center max-w-lg w-full fade-in">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-6 text-black dark:text-white" />
                    <h1 className="text-3xl font-bold mb-4">Submission Received</h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                        Your project <span className="font-bold text-black dark:text-white">"{formData.teamName}"</span> has been successfully submitted.
                    </p>
                    <button onClick={() => window.location.reload()} className="formal-button w-full">
                        Submit Another Team
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-6 lg:p-16">
            <div className="max-w-6xl mx-auto">
                <header className="mb-16 border-b border-neutral-100 dark:border-neutral-900 pb-8 flex flex-col md:flex-row justify-between items-baseline gap-4">
                    <div>
                        <h1 className="text-5xl font-bold tracking-tight mb-2">INOVESTA 2026</h1>
                        <p className="text-neutral-500 font-medium">Science Day Project Submission Portal</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Instructions Section */}
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Info className="w-5 h-5" /> Presentation Rules
                            </h2>
                            <ul className="space-y-4">
                                {guidelines.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-neutral-600 dark:text-neutral-400">
                                        <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0" />
                                        <span className="text-sm font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
                            <p className="text-xs leading-relaxed text-neutral-500">
                                * Please ensure all files are correct before clicking submit.
                                The PowerPoint (PPT) file is mandatory for all teams.
                            </p>
                        </div>
                    </div>

                    {/* Submission Form Section */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handleSubmit} className="space-y-8 fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold opacity-60 ml-1 uppercase tracking-wider">Team Number</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. NSC01"
                                        className="formal-input"
                                        value={formData.teamNumber}
                                        onChange={(e) => setFormData({ ...formData, teamNumber: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold opacity-60 ml-1 uppercase tracking-wider">Team Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter name"
                                        className="formal-input"
                                        value={formData.teamName}
                                        onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold opacity-60 ml-1 uppercase tracking-wider">Leader Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Full name"
                                        className="formal-input"
                                        value={formData.leaderName}
                                        onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-neutral-100 dark:border-neutral-900">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold opacity-60 ml-1 uppercase tracking-wider block">
                                        Upload PPT (Mandatory)
                                    </label>
                                    <div className="relative">
                                        <input required type="file" accept=".ppt,.pptx" id="ppt-file" className="hidden" onChange={(e) => handleFileChange(e, 'ppt')} />
                                        <label htmlFor="ppt-file" className="flex items-center justify-between border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-all">
                                            <div className="flex items-center gap-4">
                                                <FileText className="text-neutral-400" />
                                                <span className="font-medium text-neutral-500">
                                                    {pptFile ? pptFile.name : "Select PowerPoint File"}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 px-3 py-1 rounded">Choose</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold opacity-60 ml-1 uppercase tracking-wider block">
                                        Other Files (Drawings, Reports)
                                    </label>
                                    <div className="relative">
                                        <input type="file" multiple id="other-files" className="hidden" onChange={(e) => handleFileChange(e, 'other')} />
                                        <label htmlFor="other-files" className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-all">
                                            <div className="flex items-center gap-4">
                                                <Upload className="text-neutral-400" />
                                                <span className="font-medium text-neutral-500">
                                                    {otherFiles.length > 0 ? `${otherFiles.length} files selected` : "Attach other project files"}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 px-3 py-1 rounded">Select</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full formal-button flex items-center justify-center gap-3 py-5 text-lg"
                            >
                                {uploading ? (
                                    <><Loader2 className="animate-spin w-5 h-5" /> Sending...</>
                                ) : (
                                    <><Send className="w-5 h-5" /> Submit Project</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    )
}
