import React, { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaImage, FaTimes } from 'react-icons/fa';

const ImageUpload = ({ onImageSelect, currentImage, label = "Upload Image" }) => {
    const [preview, setPreview] = useState(currentImage || null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;

        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid image file (JPG, PNG, or WEBP)');
            return;
        }

        if (file.size > maxSize) {
            alert('File size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        onImageSelect(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        setPreview(null);
        onImageSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActive
                        ? 'border-primary-500 bg-primary-50'
                        : preview
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-primary-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleChange}
                />

                {preview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg object-cover"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                        >
                            <FaTimes />
                        </button>
                        <p className="text-sm text-gray-600 mt-2">Click to change image</p>
                    </div>
                ) : (
                    <div>
                        <FaCloudUploadAlt className="mx-auto text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-600 mb-1">
                            Drag and drop an image here, or click to select
                        </p>
                        <p className="text-xs text-gray-500">
                            JPG, PNG, or WEBP (max 5MB)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
