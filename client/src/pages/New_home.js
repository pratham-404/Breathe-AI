import React, { useState } from "react";

const predictEndpoint = "http://localhost:8000/predict/"; // Update with your FastAPI backend URL

export const New_home = () => {
  const [result, setResult] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send the file to the FastAPI server for prediction
      const response = await fetch(predictEndpoint, {
        method: "POST",
        body: formData,
      });

      // Parse the response JSON and set the result
      const data = await response.json();
      setResult(data.confidence);
    } catch (error) {
      console.error("Error predicting image:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* Your existing header content */}
      </header>
      <main>
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
          >
            {/* Your existing label content */}
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          {result !== null
            ? `For the given image, the confidence of the patient having pneumonia is ${result.toFixed(
                4
              )}`
            : ""}
        </div>
      </main>
      <footer>
        {/* Your existing footer content */}
      </footer>
    </div>
  );
};

export default New_home;
