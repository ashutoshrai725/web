// src/utils/TemplateEngine.js

export class TemplateEngine {
    constructor(companyData, userInputs) {
        this.company = companyData || {};
        this.inputs = userInputs || {};
        this.currentDate = new Date().toLocaleDateString('en-GB');
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        // Last 2 digits ke liye random number from 00 to 99
        const randomTwoDigits = String(Math.floor(Math.random() * 100)).padStart(2, '0');

        // Last 4 digits: fixed "00" + random last 2 digits
        const uniqueEnding = `00${randomTwoDigits}`;

        this.invoiceNumber = `INV/${year}${month}/${uniqueEnding}`;
        this.Number = `/${year}${month}/${uniqueEnding}`;

        // Additional numbers with different random last 2 digits
        function getRandomTwoDigits() {
            return String(Math.floor(Math.random() * 100)).padStart(2, '0');
        }

        const uniqueEnding1 = `00${getRandomTwoDigits()}`;
        const uniqueEnding2 = `00${getRandomTwoDigits()}`;
        const uniqueEnding3 = `00${getRandomTwoDigits()}`;
        const uniqueEnding4 = `00${getRandomTwoDigits()}`;

        this.Number1 = `/${year}${month}/${uniqueEnding1}`;
        this.Number2 = `/${year}${month}/${uniqueEnding2}`;
        this.Number3 = `/${year}${month}/${uniqueEnding3}`;
        this.Number4 = `/${year}${month}/${uniqueEnding4}`;









    }

    // Parse product data from user input
    parseProducts(productInput) {
        if (!productInput) return [];
        // If already an array of objects, just return
        if (Array.isArray(productInput)) {
            return productInput.map((p, idx) => ({
                sno: idx + 1,
                item: p.item || '',
                description: p.description || '',
                hsCode: p.hsCode || '',
                quantity: parseFloat(p.quantity) || 0,
                unitPrice: parseFloat(p.unitPrice) || 0,
                amount: (parseFloat(p.quantity) || 0) * (parseFloat(p.unitPrice) || 0)
            }));
        }
        // Otherwise, parse string as before
        const lines = productInput.split('\n').filter(line => line.trim());
        return lines.map((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            return {
                sno: index + 1,
                item: parts[0] || '',
                description: parts[1] || '',
                hsCode: parts[2] || '', // If you want to support HS code in string format
                quantity: parseFloat(parts[3]) || 0,
                unitPrice: parseFloat(parts[4]) || 0,
                amount: (parseFloat(parts[3]) || 0) * (parseFloat(parts[4]) || 0)
            };
        }).filter(Boolean);
    }

    // Calculate totals
    calculateTotals(products) {
        const subtotal = products.reduce((sum, product) => sum + product.amount, 0);
        return {
            subtotal: subtotal.toFixed(2),
            currency: this.inputs.currency || 'USD'
        };
    }

    // Commercial Invoice Template
    generateCommercialInvoice() {
        const products = this.parseProducts(this.inputs.products);
        const totals = this.calculateTotals(products);

        return `
            <div class="document-container" style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background: white;">
                <!-- Header -->
                <div style="text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px;">
                    <h1 style="color: #16a34a; margin: 0; font-size: 28px; font-weight: bold;">COMMERCIAL INVOICE</h1>
                </div>

                <!-- Company Details Section -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
                    <!-- Exporter Details -->
                    <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                        <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">EXPORTER / SELLER</h3>
                        <p style="margin: 5px 0; font-weight: bold;">${this.company.company_name || 'Company Name'}</p>
                        <p style="margin: 3px 0; font-size: 13px;">${this.company.comp_reg_address || 'Company Address'}</p>
                       
                    </div>

                    <!-- Buyer Details -->
                    <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                        <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">BUYER / CONSIGNEE</h3>
                        <p style="margin: 5px 0; font-weight: bold;">${this.inputs.buyer_company || 'Buyer Company Name'}</p>
                        <p style="margin: 3px 0; font-size: 13px; white-space: pre-line;">${this.inputs.buyer_address || 'Buyer Address'}</p>
                    </div>
                </div>

                <!-- Invoice Details -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
                    <div>
                        <div style="margin-bottom: 8px;"><strong>Invoice No:</strong> ${this.invoiceNumber}</div>
                        <div style="margin-bottom: 8px;"><strong>Date:</strong> ${this.currentDate}</div>
                        <div><strong>Currency:</strong> ${this.inputs.currency || 'USD'}</div>
                    </div>
                    <div>
                        <div style="margin-bottom: 8px;"><strong>Port of Loading:</strong> ${this.inputs.port_loading || 'Port of Loading'}</div>
                        <div style="margin-bottom: 8px;"><strong>Port of Discharge:</strong> ${this.inputs.port_discharge || 'Port of Discharge'}</div>
                        <div><strong>Mode of Transport:</strong> ${this.inputs.transport_mode || 'Transport Mode'}</div>
                    </div>
                </div>

                <!-- Products Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                    <thead>
                        <tr style="background: #16a34a; color: white;">
                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: left; width: 8%;">S.No</th>
                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: left; width: 25%;">Item</th>
                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: left; width: 35%;">Description</th>

                                <th style="border: 1px solid #16a34a; padding: 10px;">HS Code</th> <!-- NEW COLUMN -->

                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: center; width: 10%;">Qty</th>
                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: right; width: 12%;">Unit Price</th>
                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: right; width: 15%;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr>
                                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${product.sno}</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px;">${product.item}</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px;">${product.description}</td>

                                 <td style="border: 1px solid #e5e7eb; padding: 8px;">${product.hsCode || ''}</td> <!-- NEW COLUMN -->

                                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${product.quantity}</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${totals.currency} ${product.unitPrice.toFixed(2)}</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${totals.currency} ${product.amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Total Section -->
                <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                    <div style="border: 2px solid #16a34a; padding: 15px; border-radius: 8px; min-width: 250px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px;">
                            <strong>Total Amount:</strong>
                            <strong>${totals.currency} ${totals.subtotal}</strong>
                        </div>
                        <div style="font-size: 12px; color: #666; text-align: center;">
                            (${this.inputs.transport_mode || 'FOB'} - ${this.inputs.port_loading || 'Port of Loading'})
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #666;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <p><strong>Terms & Conditions:</strong></p>
                            <ul style="margin: 5px 0; padding-left: 15px;">
                                <li>Payment: As per agreement</li>
                                <li>Delivery: ${this.inputs.transport_mode || 'As specified'}</li>
                            </ul>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin-bottom: 40px;"><strong>For ${this.company.company_name || 'Company Name'}</strong></p>
                            
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Proforma Invoice Template (similar structure, different title)
    generateProformaInvoice() {
        const commercialTemplate = this.generateCommercialInvoice();
        return commercialTemplate.replace(
            'COMMERCIAL INVOICE',
            'PROFORMA INVOICE'
        ).replace(
            this.invoiceNumber,
            `PI${this.Number1}`
        );
    }

    // Packing List Template
    generatePackingList() {
        const products = this.parseProducts(this.inputs.products);

        return `
            <div class="document-container" style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background: white;">
                <!-- Header -->
                <div style="text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px;">
                    <h1 style="color: #16a34a; margin: 0; font-size: 28px; font-weight: bold;">PACKING LIST</h1>
                </div>

                <!-- Company Details -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
                    <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                        <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">EXPORTER / SELLER</h3>
                        <p style="margin: 5px 0; font-weight: bold;">${this.company.company_name || 'Company Name'}</p>
                        <p style="margin: 3px 0; font-size: 13px;">${this.company.comp_reg_address || 'Company Address'}</p>
                    </div>

                    <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                        <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">BUYER / CONSIGNEE</h3>
                        <p style="margin: 5px 0; font-weight: bold;">${this.inputs.buyer_company || 'Buyer Company Name'}</p>
                        <p style="margin: 3px 0; font-size: 13px; white-space: pre-line;">${this.inputs.buyer_address || 'Buyer Address'}</p>
                    </div>
                </div>

                <!-- Reference Details -->
                <div style="margin-bottom: 25px;">
                    <div><strong>Packing List No:</strong> PL${Date.now()}</div>
                    <div><strong>Date:</strong> ${this.currentDate}</div>
                    <div><strong>Invoice Reference:</strong> ${this.invoiceNumber}</div>
                </div>

                <!-- Packing Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                    <thead>
                        <tr style="background: #16a34a; color: white;">
                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: left;">Package No.</th>
                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: left;">Item Description</th>

                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: left;">HS Code</th>


                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: center;">Quantity</th>
                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: center;">Net Weight (Kg)</th>
                            <th style="border: 1px solid #16a34a; padding: 10px; text-align: center;">Gross Weight (Kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map((product, index) => `
                            <tr>
                                <td style="border: 1px solid #e5e7eb; padding: 8px;">PKG-${String(index + 1).padStart(3, '0')}</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px;">${product.item} - ${product.description}</td>

                                 <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${product.hsCode || ''}</td>

                            


                                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${product.quantity}</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(product.quantity * 10).toFixed(1)}</td>
                                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(product.quantity * 12).toFixed(1)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Summary -->
                <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #16a34a; margin-top: 0;">Shipment Summary</h3>
                    <div><strong>Total Packages:</strong> ${products.length}</div>
                    <div><strong>Total Net Weight:</strong> ${products.reduce((sum, p) => sum + (p.quantity * 10), 0).toFixed(1)} Kg</div>
                    <div><strong>Total Gross Weight:</strong> ${products.reduce((sum, p) => sum + (p.quantity * 12), 0).toFixed(1)} Kg</div>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #666; text-align: right;">
                    <p style="margin-bottom: 40px;"><strong>For ${this.company.company_name || 'Company Name'}</strong></p>
                   
                </div>
            </div>
        `;
    }

    // Main generator function
    generateTemplate(templateId) {
        switch (templateId) {
            case 'commercial_invoice':
                return this.generateCommercialInvoice();
            case 'proforma_invoice':
                return this.generateProformaInvoice();
            case 'packing_list':
                return this.generatePackingList();
            case 'delivery_challan':
                return this.generateDeliveryChallan();
            case 'credit_note':
                return this.generateCreditNote();
            case 'debit_note':
                return this.generateDebitNote();
            default:
                return '<div>Template not found</div>';
        }
    }

    // Placeholder for other templates
    generateDeliveryChallan() {
        const products = this.parseProducts(this.inputs.products);

        return `
        <div class="document-container" style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background: white;">
            <div style="text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #16a34a; margin: 0; font-size: 28px; font-weight: bold;">DELIVERY CHALLAN</h1>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
                <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                    <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">EXPORTER / SELLER</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${this.company.company_name || 'Company Name'}</p>
                    <p style="margin: 3px 0; font-size: 13px;">${this.company.comp_reg_address || 'Company Address'}</p>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                    <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">DELIVERY TO</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${this.inputs.buyer_company || 'Buyer Company Name'}</p>
                    <p style="margin: 3px 0; font-size: 13px; white-space: pre-line;">${this.inputs.buyer_address || 'Buyer Address'}</p>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <div><strong>Challan No:</strong> DC${this.Number2}</div>
                <div><strong>Date:</strong> ${this.currentDate}</div>
                <div><strong>Invoice Reference:</strong> ${this.invoiceNumber}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <thead>
                    <tr style="background: #16a34a; color: white;">
                        <th style="border: 1px solid #16a34a; padding: 10px; text-align: left;">S. No.</th>
                        <th style="border: 1px solid #16a34a; padding: 10px; text-align: left;">Description of Goods</th>
                        <th style="border: 1px solid #16a34a; padding: 10px; text-align: center;">Quantity</th>
                        <th style="border: 1px solid #16a34a; padding: 10px; text-align: center;">Unit</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td style="border: 1px solid #e5e7eb; padding: 8px;">${product.sno}</td>
                            <td style="border: 1px solid #e5e7eb; padding: 8px;">${product.item} - ${product.description}</td>
                            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${product.quantity}</td>
                            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">Nos</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="font-size: 11px; color: #666;">
                <p><strong>Note:</strong> Delivery is subject to the terms and conditions agreed upon in the contract.</p>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #666; text-align: right;">
                <p style="margin-bottom: 40px;"><strong>For ${this.company.company_name || 'Company Name'}</strong></p>
               
            </div>
        </div>
    `;
    }


    generateCreditNote() {
        return `
        <div class="document-container" style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background: white;">
            <div style="text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #16a34a; margin: 0; font-size: 28px; font-weight: bold;">CREDIT NOTE</h1>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
                <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                    <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">SELLER / ISSUER</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${this.company.company_name || 'Company Name'}</p>
                    <p style="margin: 3px 0; font-size: 13px;">${this.company.comp_reg_address || 'Company Address'}</p>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                    <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">BUYER / RECEIVER</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${this.inputs.buyer_company || 'Buyer Company Name'}</p>
                    <p style="margin: 3px 0; font-size: 13px; white-space: pre-line;">${this.inputs.buyer_address || 'Buyer Address'}</p>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <div><strong>Credit Note No:</strong> CN${this.Number3}</div>
                <div><strong>Date:</strong> ${this.currentDate}</div>
                <div><strong>Reference Invoice:</strong> ${this.invoiceNumber}</div>
            </div>

            <div style="margin-bottom: 20px; font-size: 13px;">
                <p><strong>Reason for Credit Note:</strong></p>
                <p>Price Discount</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #16a34a; color: white;">
                        <th style="border: 1px solid #16a34a; padding: 10px; text-align: left;">Description</th>
                        <th style="border: 1px solid #16a34a; padding: 10px; text-align: right;">Amount (${this.inputs.currency || 'USD'})</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #e5e7eb; padding: 8px;">Total Credit Amount</td>
                        <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${this.inputs.credit_note_amount || '0.00'}</td>
                    </tr>
                </tbody>
            </table>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #666; text-align: right;">
                <p style="margin-bottom: 40px;"><strong>For ${this.company.company_name || 'Company Name'}</strong></p>
               
            </div>
        </div>
    `;
    }


    generateDebitNote() {
        return `
        <div class="document-container" style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background: white;">
            <div style="text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="color: #16a34a; margin: 0; font-size: 28px; font-weight: bold;">DEBIT NOTE</h1>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
                <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                    <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">BILLER / ISSUER</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${this.company.company_name || 'Company Name'}</p>
                    <p style="margin: 3px 0; font-size: 13px;">${this.company.comp_reg_address || 'Company Address'}</p>
                </div>
                <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                    <h3 style="color: #16a34a; margin-top: 0; font-size: 14px; font-weight: bold;">BUYER / RECEIVER</h3>
                    <p style="margin: 5px 0; font-weight: bold;">${this.inputs.buyer_company || 'Buyer Company Name'}</p>
                    <p style="margin: 3px 0; font-size: 13px; white-space: pre-line;">${this.inputs.buyer_address || 'Buyer Address'}</p>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <div><strong>Debit Note No:</strong> DN${this.Number4}</div>
                <div><strong>Date:</strong> ${this.currentDate}</div>
                <div><strong>Reference Invoice:</strong> ${this.invoiceNumber}</div>
            </div>

            <div style="margin-bottom: 20px; font-size: 13px;">
                <p><strong>Reason for Debit Note:</strong></p>
                <p>Additional Freight Charges</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #16a34a; color: white;">
                        <th style="border: 1px solid #16a34a; padding: 10px; text-align: left;">Description</th>
                        <th style="border: 1px solid #16a34a; padding: 10px; text-align: right;">Amount (${this.inputs.currency || 'USD'})</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #e5e7eb; padding: 8px;">Total Debit Amount</td>
                        <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">${this.inputs.debit_note_amount || '0.00'}</td>
                    </tr>
                </tbody>
            </table>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #666; text-align: right;">
                <p style="margin-bottom: 40px;"><strong>For ${this.company.company_name || 'Company Name'}</strong></p>
                
            </div>
        </div>
    `;
    }

}

// Utility function to generate all selected templates
export const generateDocuments = (selectedTemplates, companyData, userInputs) => {
    const engine = new TemplateEngine(companyData, userInputs);

    return selectedTemplates.map(template => ({
        id: template.id,
        name: template.name,
        html: engine.generateTemplate(template.id)
    }));
};
