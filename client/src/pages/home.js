import React, { useState } from 'react';

const predictEndpoint = "http://localhost:8000/predict/";

export const Home = () => {

	const [result, setResult] = useState(null);

	const handleFileChange = async (event) => {
		const file = event.target.files[0];

		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await fetch(predictEndpoint, {
				method: "POST",
				body: formData,
			});

			const data = await response.json();
			setResult(data.confidence);
		} catch (error) {
			console.error("Error predicting image:", error);
		}
	};

	return (
		<div className="flex flex-col mx-20">
			<div className="flex flex-col items-center text-gray-950 dark:text-gray-100 my-4">
				<h1 className="text-6xl font-bold mb-4">Pneumonia Prediction Model</h1>
				<p className="text-lg text-center">Get predictions from X-ray images using a pre-trained ML model based on Convolutional Neural Networks (CNN).</p>
			</div>

			<div className="flex flex-col items-center">
				<div className="py-5">
					<div className="text-blue-600 mt-4 font-bold">{result !== null ? `For the given X-Ray, confidence of the patient having pneumonia is ${result.toFixed(4)}` : ""}</div>
				</div>
			</div>

			<div className="flex items-center justify-center w-full">
				<label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-1/2 h-96 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
					<div className="flex flex-col items-center justify-center pt-5 pb-6">
						<svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
							<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
						</svg>
						<p className="mb-2 text-lg text-blue-700 dark:text-blue-500 text">
							<span className="font-semibold">Click to upload</span> or drag and drop
						</p>
						<p className="text-m text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF</p>
						<input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
					</div>
				</label>
			</div>
		</div>
	);
};
