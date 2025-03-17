import React, { useState } from 'react';
import axios from 'axios';

const WoundDetection = () => {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select an image");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await axios.post("/api/wound-detection", formData);
            setResult(response.data.data);
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to detect wound");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wound-detection">
            <h1>Wound Detection</h1>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={loading}>
                {loading ? "Detecting..." : "Detect Wound"}
            </button>

            {result && (
                <div className="result">
                    <h2>Detection Result:</h2>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default WoundDetection;
