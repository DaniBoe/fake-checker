"use client";

import { useCallback, useState } from "react";

export default function Dropzone({ onFileSelected, onSubmit, loading }: { onFileSelected: (f: File)=>void; onSubmit: (f: File)=>Promise<void>; loading?: boolean; }) {
	const [dragOver, setDragOver] = useState(false);
	const [file, setFile] = useState<File| null>(null);

	const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
	const MAX_SIZE = 8 * 1024 * 1024; // 8MB

	const validateFile = (file: File): string | null => {
		if (!ALLOWED_TYPES.includes(file.type)) {
			return `Invalid file type. Please upload JPG, PNG, or HEIC files only.`;
		}
		if (file.size > MAX_SIZE) {
			return `File too large. Please upload files smaller than 8MB.`;
		}
		return null;
	};

	const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragOver(false);
		const f = e.dataTransfer.files?.[0];
		if (f) {
			const error = validateFile(f);
			if (error) {
				alert(error);
				return;
			}
			setFile(f); 
			onFileSelected(f);
		}
	}, [onFileSelected]);

	function onPick(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		if (f) {
			const error = validateFile(f);
			if (error) {
				alert(error);
				return;
			}
			setFile(f); 
			onFileSelected(f);
		}
	}

	return (
		<div className="space-y-3">
			<p className="text-sm font-medium text-gray-200"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">1</span>Upload your Labubu photo</p>
			<div
				className={`border-2 border-dashed rounded-xl p-4 sm:p-8 text-center ${dragOver ? "bg-white/5" : "bg-transparent"}`}
				onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
				onDragLeave={()=>setDragOver(false)}
				onDrop={onDrop}
			>
				<p className="mb-3 text-sm sm:text-base text-gray-300">Drop image here or click to select — JPG, PNG, HEIC (max 8MB)</p>
				<input aria-label="Upload image" type="file" accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp" onChange={onPick} className="mx-auto block text-xs sm:text-sm" />
			</div>
			<p className="text-sm font-medium text-gray-200"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">2</span>Run the check</p>
			<button disabled={!file || loading} onClick={()=> file && onSubmit(file)} className="w-full rounded-md bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black py-2 font-medium disabled:opacity-50">
				{loading ? "Checking..." : "Check image"}
			</button>
			{loading && (
				<div className="h-2 w-full overflow-hidden rounded bg-white/10">
					<div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] bg-gradient-to-r from-cyan-400 to-fuchsia-500" />
				</div>
			)}
			{!file && <p className="text-xs text-gray-400">Choose an image first to enable the check.</p>}
			<style jsx>{`
			@keyframes progress { 0% { transform: translateX(-100%);} 50% { transform: translateX(50%);} 100% { transform: translateX(200%);} }
			`}</style>
		</div>
	);
}
