import React, { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [code, setCode] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'file' | 'code'>('file');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();
    if (uploadType === 'file' && file) {
      formData.append('cppFile', file);
    } else if (uploadType === 'code') {
      formData.append('code', code);
    } else {
      return;
    }

    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      setResponse(result.output || result.error);
    } catch (error) {
      setResponse('An error occurred');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>
          <input
            type="radio"
            name="uploadType"
            value="file"
            checked={uploadType === 'file'}
            onChange={() => setUploadType('file')}
          />
          Upload .cpp File
        </label>
        <label>
          <input
            type="radio"
            name="uploadType"
            value="code"
            checked={uploadType === 'code'}
            onChange={() => setUploadType('code')}
          />
          Enter C++ Code
        </label>
        {uploadType === 'file' ? (
          <input type="file" name="cppFile" accept=".cpp" onChange={handleFileChange} />
        ) : (
          <textarea
            name="code"
            value={code}
            onChange={handleCodeChange}
            rows={10}
            cols={50}
            placeholder="Enter C++ code here"
          />
        )}
        <button type="submit">Submit</button>
      </form>
      {response && <pre>{response}</pre>}
    </div>
  );
}
