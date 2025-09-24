// src/components/AIAgent/AIAgentPage.js

import { ITEM_DATABASE } from './itemDatabase';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, FileText } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Header from '../LandingPage/Header';
import { generateDocuments } from '../LandingPage/TemplateEngine'; // ← PROPER IMPORT


const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

const AIAgentPage = ({ user, onPageChange, onLogout, documentsUploaded = true }) => {
    const [messages, setMessages] = useState([]);
    const [currentStep, setCurrentStep] = useState('loading');
    const [initialized, setInitialized] = useState(false);
    const [selectedTemplates, setSelectedTemplates] = useState([]);
    const [companyData, setCompanyData] = useState(null);
    const [userInputs, setUserInputs] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [awaitingInput, setAwaitingInput] = useState(false);
    const [generatedDocuments, setGeneratedDocuments] = useState([]); // ← ADDED STATE
    const [activeDocIndex, setActiveDocIndex] = useState(0);
    const [manualFillRequired, setManualFillRequired] = useState(false);

    const [productEntryStep, setProductEntryStep] = useState(0); // 0: item, 1: qty, 2: price
    const [currentProduct, setCurrentProduct] = useState({ item: '', description: '', hsCode: '', quantity: '', unitPrice: '' });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);

    const [products, setProducts] = useState([]);


    useEffect(() => {
        if (currentStep === 'data_collection' && awaitingInput === false) {
            askNextQuestion();
        }
        // eslint-disable-next-line
    }, [currentStep, currentQuestion]);

    const handleManualSubmit = () => {
        if (!companyData?.company_name || !companyData?.comp_address) {
            alert('Please fill all required company details.');
            return;
        }
        setManualFillRequired(false);
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'bot',
            content: 'Thanks for providing your company information. Let\'s continue.',
            timestamp: new Date()
        }]);
        setCurrentStep('data_collection');
        setAwaitingInput(true);
        setCurrentQuestion(0);
    }




    // Questions to ask user
    const questions = [
        { field: 'buyer_company', question: 'What is the buyer\'s company name?', type: 'text' },
        { field: 'buyer_address', question: 'What is the buyer\'s complete address with country?', type: 'textarea' },
        { field: 'products', question: 'Please add your products one by one.', type: 'products' },

        { field: 'currency', question: 'What currency would you like to use?', type: 'select', options: ['USD', 'EUR', 'INR', 'GBP'] },
        { field: 'port_loading', question: 'Which is the Port of Loading?', type: 'text' },
        { field: 'port_discharge', question: 'Which is the Port of Discharge?', type: 'text' },
        { field: 'transport_mode', question: 'What is the mode of transport?', type: 'select', options: ['Sea', 'Air', 'Road'] },

        { field: 'credit_note_amount', question: 'What is the amount for the Credit Note?', type: 'text' },


        { field: 'debit_note_amount', question: 'What is the amount for the Debit Note?', type: 'text' },
    ];

    useEffect(() => {
        if (initialized) return;

        if (!documentsUploaded) {
            setMessages([{
                id: 1,
                type: 'bot',
                content: '⚠️ Please upload your identity and company documents first to use the AI Agent.',
                timestamp: new Date(),
                showUploadButton: true
            }]);
            setCurrentStep('need_documents');
            setInitialized(true);
            return;
        }

        setTimeout(() => {
            setMessages([
                {
                    id: 1,
                    type: 'bot',
                    content: 'Hello! Welcome to ManuDocs AI Agent! 🤖\n\nI can help you generate professional export documents.',
                    timestamp: new Date()
                },
                {
                    id: 2,
                    type: 'bot',
                    content: 'Which documents would you like to generate?',
                    timestamp: new Date(),
                    showTemplateSelector: true
                }
            ]);
            setCurrentStep('template_selection');
            setInitialized(true);
        }, 1000);

    }, [documentsUploaded, initialized]);

    const fetchCompanyData = async () => {
        try {
            setManualFillRequired(false); // reset on every attempt
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                content: '🔄 Fetching your company information...',
                timestamp: new Date()
            }]);

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error || !data) {
                console.error('Error fetching company data:', error);
                // Set flag to show manual fill UI
                setManualFillRequired(true);

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'bot',
                    content: 'We could not retrieve your company information automatically. Please fill it manually below.',
                    manualFill: true,
                    timestamp: new Date()
                }]);
                return null;
            }

            setCompanyData(data);

            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                content: `✅ Company info loaded:\n\n• Company: ${data.company_name}\n\n• Address: ${data.comp_reg_address} \n\n
                Now, please answer some questions.`,
                timestamp: new Date()
            }]);

            return data;

        } catch (error) {
            console.error('Supabase fetch error:', error);
            setManualFillRequired(true);
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                content: 'There was an error fetching your company info. Please enter the details manually below.',
                manualFill: true,
                timestamp: new Date()
            }]);
            return null;
        }
    }


    // Handle template selection
    const handleTemplateSelection = async () => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const selected = Array.from(checkboxes).map(cb => ({
            id: cb.value,
            name: cb.getAttribute('data-name')
        }));

        if (selected.length === 0) {
            alert('Please select at least one document to generate');
            return;
        }

        setSelectedTemplates(selected);

        setMessages(prev => [...prev,
        {
            id: Date.now(),
            type: 'user',
            content: `Selected: ${selected.map(t => t.name).join(', ')}`,
            timestamp: new Date()
        }
        ]);
        await fetchCompanyData();

        setCurrentStep('data_collection');


        // Fetch company data and then start questions
        setCurrentQuestion(0);





    };


    // Ask questions one by one
    const askNextQuestion = () => {
        if (currentQuestion < questions.length) {
            const question = questions[currentQuestion];

            // If it's the products step, trigger product entry UI
            if (question.field === 'products') {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'bot',
                    content: `Let's add your products one by one. Start typing the item name below.`,
                    timestamp: new Date(),
                    showInput: true,
                    inputType: 'products',
                    expectedField: 'products'
                }]);
                setAwaitingInput(true);
                return;
            }

            // Default question UI
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                content: `${currentQuestion + 1}/${questions.length} - ${question.question}`,
                timestamp: new Date(),
                showInput: true,
                inputType: question.type,
                inputOptions: question.options,
                expectedField: question.field
            }]);
            setAwaitingInput(true);
        } else {
            completeDataCollection();
        }
    };

    // Handle user input
    const handleUserInput = (inputValue, field) => {
        setUserInputs(prev => ({
            ...prev,
            [field]: inputValue
        }));

        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        }]);

        setCurrentQuestion(prev => prev + 1);
        setAwaitingInput(false);


    };

    const downloadAllPdfs = async () => {
        if (generatedDocuments.length === 0) {
            alert("No documents generated to download.");
            return;
        }
        for (const doc of generatedDocuments) {
            const container = document.createElement('div');
            container.style.position = 'fixed';  // taaki screen pe na dikhe
            container.style.left = '-9999px';
            container.innerHTML = doc.html;
            document.body.appendChild(container);

            const canvas = await html2canvas(container, { scale: 2 });

            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${doc.name || 'Document'}.pdf`);
        }
    };


    // Complete data collection - FIXED VERSION
    const completeDataCollection = () => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'bot',
            content: '🎉 All information collected!\n\nGenerating your documents now...\n\n📄 Templates will be populated with:\n✅ Company data (auto-filled)\n✅ Your provided information\n✅ Professional formatting',
            timestamp: new Date()
        }]);

        setCurrentStep('generating');

        // Generate templates using the engine - FIXED
        try {
            const generatedDocs = generateDocuments(selectedTemplates, companyData, userInputs);
            setGeneratedDocuments(generatedDocs);

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'bot',
                    content: '✅ Documents generated successfully!\n\nYou can preview and download them from the right panel.',
                    timestamp: new Date(),
                    showDownloadButton: true
                }]);
                setCurrentStep('completed');
            }, 3000);
        } catch (error) {
            console.error('Template generation error:', error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                content: '❌ Error generating documents. Please try again.',
                timestamp: new Date()
            }]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                user={user}
                onPageChange={onPageChange}
                onLogout={onLogout}
                documentsUploaded={documentsUploaded}
            />

            <div className="pt-16 h-screen flex">
                {/* Back Button */}
                <div className="absolute top-10 left-4 z-10">
                    <button
                        onClick={() => onPageChange('landing')}
                        className="flex items-center text-black-600 hover:text-manu-green transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Home
                    </button>
                </div>

                {/* Left Panel - Chat Interface */}
                <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-manu-green text-white">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <MessageCircle className="text-manu-green" size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold">E-CHA AI Agent</h3>
                                <p className="text-sm opacity-90">Export Document Assistant</p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((message) => (





                            <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-lg p-3 ${message.type === 'user'
                                    ? 'bg-manu-green text-white'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    <div className="whitespace-pre-wrap">{message.content}</div>

                                    {/* Yahan manual fill form add karo */}
                                    {message.manualFill && manualFillRequired && (
                                        <div className="manual-fill-form p-4 border rounded bg-white mt-4">
                                            <input
                                                type="text"
                                                placeholder="Company Name"
                                                value={companyData?.company_name || ''}
                                                onChange={(e) =>
                                                    setCompanyData((prev) => ({ ...prev, company_name: e.target.value }))
                                                }
                                                className="mb-2 p-2 border rounded w-full"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Company Address"
                                                value={companyData?.comp_reg_address || ''}
                                                onChange={(e) =>
                                                    setCompanyData((prev) => ({ ...prev, comp_reg_address: e.target.value }))
                                                }
                                                className="mb-2 p-2 border rounded w-full"
                                            />

                                            {/* Add Submit button */}

                                        </div>
                                    )}

                                    {/* Upload Documents Button */}
                                    {message.showUploadButton && (
                                        <button
                                            onClick={() => onPageChange('upload')}
                                            className="mt-3 bg-manu-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                                        >
                                            Upload Documents
                                        </button>
                                    )}

                                    {/* Template Selector */}
                                    {message.showTemplateSelector && (
                                        <div className="mt-4 space-y-2">
                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                                Select documents to generate:
                                            </p>

                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { id: 'commercial_invoice', name: 'Commercial Invoice', desc: 'Main export invoice' },
                                                    { id: 'proforma_invoice', name: 'Proforma Invoice', desc: 'Quotation document' },
                                                    { id: 'packing_list', name: 'Packing List', desc: 'Item packaging details' },
                                                    { id: 'delivery_challan', name: 'Delivery Challan', desc: 'Export shipment details' },
                                                    { id: 'credit_note', name: 'Credit Note', desc: 'Amount adjustment' },
                                                    { id: 'debit_note', name: 'Debit Note', desc: 'Additional charges' }
                                                ].map((template) => (
                                                    <label key={template.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            value={template.id}
                                                            data-name={template.name}
                                                            className="text-manu-green"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">📄 {template.name}</div>
                                                            <div className="text-xs text-gray-500">{template.desc}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>

                                            <button
                                                className="w-full mt-3 bg-manu-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                                                onClick={handleTemplateSelection}
                                            >
                                                Generate Selected Documents
                                            </button>
                                        </div>
                                    )}

                                    {/* Input Fields for Questions */}
                                    {message.showInput && awaitingInput && (
                                        <div className="mt-4">
                                            {message.inputType === 'text' && (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter your answer..."
                                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                                e.preventDefault();
                                                                handleUserInput(e.target.value.trim(), message.expectedField);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            const input = e.target.previousElementSibling;
                                                            if (input.value.trim()) {
                                                                handleUserInput(input.value.trim(), message.expectedField);
                                                                input.value = '';
                                                            }
                                                        }}
                                                        className="w-full bg-manu-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                                                    >
                                                        Send Answer
                                                    </button>
                                                </div>
                                            )}

                                            {message.inputType === 'textarea' && (
                                                <div className="space-y-2">
                                                    <textarea
                                                        placeholder="Enter complete address..."
                                                        rows="3"
                                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && e.ctrlKey && e.target.value.trim()) {
                                                                e.preventDefault();
                                                                handleUserInput(e.target.value.trim(), message.expectedField);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                    ></textarea>
                                                    <button
                                                        onClick={(e) => {
                                                            const textarea = e.target.previousElementSibling;
                                                            if (textarea.value.trim()) {
                                                                handleUserInput(textarea.value.trim(), message.expectedField);
                                                                textarea.value = '';
                                                            }
                                                        }}
                                                        className="w-full bg-manu-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                                                    >
                                                        Send Answer
                                                    </button>
                                                    <p className="text-xs text-gray-500">Press Ctrl+Enter or click button</p>
                                                </div>
                                            )}

                                            {message.inputType === 'select' && (
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {message.inputOptions?.map((option) => (
                                                            <button
                                                                key={option}
                                                                onClick={() => handleUserInput(option, message.expectedField)}
                                                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm hover:border-manu-green"
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {message.inputType === 'products' && awaitingInput && (
                                                <div className="space-y-2 mt-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Type item name..."
                                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                                        value={currentProduct.item}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setCurrentProduct({ ...currentProduct, item: val });
                                                            if (val.length > 0) {
                                                                setShowSuggestions(true);
                                                                setFilteredItems(
                                                                    ITEM_DATABASE.filter(
                                                                        item =>
                                                                            item.name.toLowerCase().includes(val.toLowerCase()) ||
                                                                            item.description.toLowerCase().includes(val.toLowerCase())
                                                                    )
                                                                );
                                                            } else {
                                                                setShowSuggestions(false);
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                    {showSuggestions && filteredItems.length > 0 && (
                                                        <div className="border rounded bg-white shadow-md max-h-48 overflow-y-auto z-10">
                                                            {filteredItems.map(item => (
                                                                <div
                                                                    key={item.hsCode}
                                                                    className="p-2 hover:bg-manu-green hover:text-white cursor-pointer"
                                                                    onClick={() => {
                                                                        setCurrentProduct({
                                                                            ...currentProduct,
                                                                            item: item.name,
                                                                            description: item.description,
                                                                            hsCode: item.hsCode
                                                                        });
                                                                        setShowSuggestions(false);
                                                                        setProductEntryStep(1);
                                                                    }}
                                                                >
                                                                    <div className="font-semibold">{item.name}</div>
                                                                    <div className="text-xs text-gray-500">{item.description}</div>
                                                                    <div className="text-xs text-blue-600">HS Code: {item.hsCode}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {currentProduct.description && (
                                                        <div className="mt-2 p-2 bg-gray-50 border rounded">
                                                            <div><strong>Description:</strong> {currentProduct.description}</div>
                                                            <div><strong>HS Code:</strong> {currentProduct.hsCode}</div>
                                                        </div>
                                                    )}
                                                    {productEntryStep === 1 && (
                                                        <>
                                                            <input
                                                                type="number"
                                                                placeholder="Quantity"
                                                                className="w-full p-2 border border-gray-200 rounded-lg mt-2"
                                                                value={currentProduct.quantity}
                                                                onChange={e => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                                                            />
                                                            <input
                                                                type="number"
                                                                placeholder="Unit Price"
                                                                className="w-full p-2 border border-gray-200 rounded-lg mt-2"
                                                                value={currentProduct.unitPrice}
                                                                onChange={e => setCurrentProduct({ ...currentProduct, unitPrice: e.target.value })}
                                                            />
                                                            <button
                                                                className="w-full bg-manu-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm mt-2"
                                                                onClick={() => {
                                                                    if (!currentProduct.quantity || !currentProduct.unitPrice) {
                                                                        alert("Please enter quantity and unit price.");
                                                                        return;
                                                                    }
                                                                    // Save product
                                                                    setProducts([currentProduct]); // Only one product
                                                                    setUserInputs(prev => ({
                                                                        ...prev,
                                                                        products: [currentProduct]
                                                                    }));
                                                                    setMessages(prev => [...prev, {
                                                                        id: Date.now(),
                                                                        type: 'user',
                                                                        content: `Added: ${currentProduct.item} | ${currentProduct.description} | ${currentProduct.hsCode} | Qty: ${currentProduct.quantity} | Price: ${currentProduct.unitPrice}`,
                                                                        timestamp: new Date()
                                                                    }]);
                                                                    // Reset for next question
                                                                    setCurrentProduct({ item: '', description: '', hsCode: '', quantity: '', unitPrice: '' });
                                                                    setProductEntryStep(0);
                                                                    setShowSuggestions(false);
                                                                    setFilteredItems([]);
                                                                    setCurrentQuestion(prev => prev + 1); // Move to next question
                                                                    setAwaitingInput(false);
                                                                }}
                                                            >
                                                                Add Product
                                                            </button>






                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Download Button */}
                                    {message.showDownloadButton && (
                                        <button
                                            className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                            onClick={() => {
                                                console.log('Generated Documents:', generatedDocuments);
                                                alert('Preview feature will be added next!');
                                            }}
                                        >
                                            📥 Preview Documents
                                        </button>
                                    )}

                                    <div className="text-xs opacity-70 mt-2">
                                        {new Date(message.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area - Hidden during questionnaire */}
                    {!awaitingInput && (
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-manu-green"
                                />
                                <button className="bg-manu-green text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                                    Send
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel - Template Preview */}
                <div className="w-1/2 bg-gray-100 flex flex-col">
                    {/* Preview Header */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex items-center space-x-3">
                            <FileText className="text-manu-green" size={20} />
                            <div>
                                <h3 className="font-semibold">Document Preview</h3>
                                <p className="text-sm text-gray-600">Live preview of your documents</p>
                            </div>
                        </div>
                    </div>

                    {/* Preview Content */}
                    <div className="flex-1 p-4">
                        {currentStep === 'template_selection' && (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {[
                                            { icon: '📄', name: 'Invoice' },
                                            { icon: '📋', name: 'Proforma' },
                                            { icon: '📦', name: 'Packing' },
                                            { icon: '🚛', name: 'Challan' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                                <div className="text-2xl mb-2">{item.icon}</div>
                                                <div className="text-sm font-medium text-gray-700">{item.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Choose your documents from the chat panel
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentStep === 'data_collection' && (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-white text-xl">📝</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Collecting Information
                                    </h3>
                                    <p className="text-gray-500 mb-4">
                                        Question {currentQuestion + 1} of {questions.length}
                                    </p>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 'generating' && (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <span className="text-white text-xl">⚡</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        Generating Documents...
                                    </h3>
                                    <p className="text-gray-500">
                                        Please wait while we create your professional export documents
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentStep === 'completed' && (
                            <div className="bg-white rounded-lg p-6 shadow-sm h-full">

                                <button
                                    className="mb-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={downloadAllPdfs}
                                >
                                    Download All PDFs
                                </button>


                                {/* Tabs for each template */}
                                {generatedDocuments.length > 1 && (
                                    <div className="flex space-x-2 border-b pb-2 mb-3">
                                        {generatedDocuments.map((doc, i) => (
                                            <button
                                                key={doc.id}
                                                onClick={() => setActiveDocIndex(i)}
                                                className={`px-4 py-1 rounded-t ${activeDocIndex === i ? 'bg-manu-green text-white' : 'bg-gray-200 text-gray-700'} text-sm font-semibold`}
                                            >
                                                {doc.name}
                                            </button>
                                        ))}
                                    </div>
                                )}





                                {/* Preview HTML */}
                                <div style={{ minHeight: 500 }}>
                                    {generatedDocuments.length > 0 && (
                                        <div
                                            className="document-html-preview"
                                            dangerouslySetInnerHTML={{ __html: generatedDocuments[activeDocIndex]?.html }}
                                        />
                                    )}
                                    {generatedDocuments.length === 0 && (
                                        <div className="text-gray-500">No preview available.</div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAgentPage;
