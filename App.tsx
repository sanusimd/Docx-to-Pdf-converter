
import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Loader from './components/Loader';
import { FileWord, FilePdf, Download, RotateCcw, AlertTriangle, X } from 'lucide-react';

// Declare global variables from CDN scripts
declare var mammoth: any;
declare var html2pdf: any;

type Status = 'idle' | 'file-selected' | 'converting' | 'success' | 'error';

const App: React.FC = () => {
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    // Clean up the object URL when the component unmounts or pdfUrl changes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);
  
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setDocxFile(file);
      setStatus('file-selected');
      setErrorMessage(null);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    } else {
      setErrorMessage('Invalid file type. Please upload a .docx file.');
      setStatus('error');
      setDocxFile(null);
    }
  }, [pdfUrl]);

  const handleConvert = async () => {
    if (!docxFile) return;

    setStatus('converting');
    setErrorMessage(null);

    try {
      const arrayBuffer = await docxFile.arrayBuffer();

      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

      const element = document.createElement('div');
      element.innerHTML = html;
      element.style.position = 'absolute';
      element.style.width = '210mm'; // Standard A4 width
      element.style.left = '-9999px';
      element.style.top = '0';
      document.body.appendChild(element);

      const opt = {
        margin:       1,
        filename:     `${docxFile.name.replace(/\.docx$/, '')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setPdfUrl(url);
      setStatus('success');
      document.body.removeChild(element);
    } catch (err) {
      console.error(err);
      setErrorMessage('Conversion failed. The file might be corrupted or unsupported.');
      setStatus('error');
    }
  };

  const handleReset = useCallback(() => {
    setDocxFile(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setErrorMessage(null);
    setStatus('idle');
  }, [pdfUrl]);

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return <FileUpload onFileSelect={handleFileSelect} />;
      case 'file-selected':
        return (
          <div className="text-center">
            <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700 p-4 rounded-lg mb-6">
              <FileWord className="h-8 w-8 text-blue-500 mr-4" />
              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{docxFile?.name}</span>
               <button onClick={handleReset} className="ml-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <button
              onClick={handleConvert}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              Convert to PDF
            </button>
          </div>
        );
      case 'converting':
        return (
          <div className="text-center">
            <Loader />
            <p className="mt-4 text-slate-600 dark:text-slate-300">Converting your file...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Please wait, this may take a moment.</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
             <div className="flex items-center justify-center bg-green-100 dark:bg-green-900/50 p-4 rounded-lg mb-6 text-green-700 dark:text-green-300">
                <FilePdf className="h-8 w-8 mr-4" />
                <span className="font-medium truncate">{docxFile?.name.replace(/\.docx$/, '.pdf')}</span>
            </div>
            <a
              href={pdfUrl!}
              download={`${docxFile?.name.replace(/\.docx$/, '')}.pdf`}
              className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              <Download className="mr-2" size={20} />
              Download PDF
            </a>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-all duration-300"
            >
              <RotateCcw className="mr-2" size={16} />
              Convert Another File
            </button>
          </div>
        );
      case 'error':
        return (
           <div className="text-center">
            <div className="flex items-center justify-center bg-red-100 dark:bg-red-900/50 p-4 rounded-lg mb-6 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-8 w-8 mr-4" />
              <p className="font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-300"
            >
               <RotateCcw className="mr-2 inline" size={16} />
              Try Again
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-lg">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-2">
              DOCX to PDF Converter
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Fast, private, and secure. Your files never leave your browser.
            </p>
            <div className="min-h-[200px] flex items-center justify-center">
                {renderContent()}
            </div>
          </div>
        </div>
        <footer className="text-center mt-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} - All conversions are processed locally.
            </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
