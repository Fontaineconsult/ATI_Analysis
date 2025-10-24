// Function to generate HTML for copying goal group to clipboard
const generateGoalHTML = (goal, workingGroupName) => {
    const baseUrl = window.location.origin;
    const goalNumber = goal.goal?.properties?.goal_number;
    const goalName = goal.goal?.properties?.name;

    if (!goal.indicators || goal.indicators.length === 0) {
        return `<p>No indicators available for Goal ${goalNumber}: ${goalName}</p>`;
    }

    const sortedIndicators = [...goal.indicators].sort((a, b) => {
        const aNum = parseInt(a.indicator?.properties?.composite_key?.split('-')[0]?.split('.')[1] || 0);
        const bNum = parseInt(b.indicator?.properties?.composite_key?.split('-')[0]?.split('.')[1] || 0);
        return aNum - bNum;
    });

    // Start HTML
    let html = `<div style="font-family: Arial, sans-serif;">`;
    html += `<h3 style="color: #2C7A7B; margin-bottom: 10px;">Goal ${goalNumber}: ${goalName}</h3>`;
    html += `<table style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 12px;">`;
    html += `<thead>`;
    html += `<tr style="background-color: #F7FAFC; border-bottom: 2px solid #E2E8F0;">`;
    html += `<th style="padding: 8px; text-align: left; font-weight: 600; color: #4A5568;">ID</th>`;
    html += `<th style="padding: 8px; text-align: left; font-weight: 600; color: #4A5568;">Description</th>`;
    html += `<th style="padding: 8px; text-align: left; font-weight: 600; color: #4A5568;">View</th>`;
    html += `<th style="padding: 8px; text-align: left; font-weight: 600; color: #4A5568;">Direct Link</th>`;
    html += `</tr>`;
    html += `</thead>`;
    html += `<tbody>`;

    sortedIndicators.forEach((indicator) => {
        const compositeKey = indicator.indicator?.properties?.composite_key;
        const indicatorNumber = compositeKey?.split('-')[0]?.split('.')[1];
        const description = indicator.indicator?.properties?.success_indicator || '';

        // Generate View URL
        const [numbers, suffix] = compositeKey.split('-');
        const [gNum, iNum] = numbers.split('.');
        const workingGroupMap = {
            'web': 'web',
            'pro': 'procurement',
            'ins': 'instructional-materials'
        };
        const workingGroupSegment = workingGroupMap[suffix] || suffix;
        const viewUrl = `${baseUrl}/dashboard/reports/${workingGroupSegment}/${gNum}/${iNum}`;

        // Generate Direct Link (with hash)
        const directLinkUrl = `${baseUrl}/dashboard/reports#${compositeKey}`;

        html += `<tr style="border-bottom: 1px solid #E2E8F0;">`;
        html += `<td style="padding: 8px; color: #2D3748;">${goalNumber}.${indicatorNumber}</td>`;
        html += `<td style="padding: 8px; color: #2D3748;">${description}</td>`;
        html += `<td style="padding: 8px;"><a href="${viewUrl}" style="color: #319795; text-decoration: none;">View Report</a></td>`;
        html += `<td style="padding: 8px;"><a href="${directLinkUrl}" style="color: #319795; text-decoration: none;">Direct Link</a></td>`;
        html += `</tr>`;
    });

    html += `</tbody>`;
    html += `</table>`;
    html += `</div>`;

    return html;
};

// Function to copy HTML using the modern clipboard API
const copyHTMLToClipboard = async (html, plainText) => {
    // Check for Clipboard API support with write method
    if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not supported');
    }

    try {
        // Create ClipboardItem with both HTML and plain text representations
        const clipboardItem = new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
        });

        // Write to clipboard
        await navigator.clipboard.write([clipboardItem]);
        return 'HTML';
    } catch (err) {
        // If HTML fails, try just plain text
        if (err.name === 'NotAllowedError') {
            // Try to request permission
            try {
                await navigator.permissions.query({ name: 'clipboard-write' });
                // Retry
                const clipboardItem = new ClipboardItem({
                    'text/html': new Blob([html], { type: 'text/html' }),
                    'text/plain': new Blob([plainText], { type: 'text/plain' })
                });
                await navigator.clipboard.write([clipboardItem]);
                return 'HTML';
            } catch (permErr) {
                throw permErr;
            }
        }
        throw err;
    }
};

// Function to copy using document.execCommand (legacy fallback)
const copyWithExecCommand = (html, plainText) => {
    // Create a temporary div with contenteditable
    const tempDiv = document.createElement('div');
    tempDiv.contentEditable = 'true';
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);

    // Select the content
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Try to copy
    let success = false;
    try {
        success = document.execCommand('copy');
    } catch (e) {
        console.error('execCommand failed:', e);
    }

    // Clean up
    selection.removeAllRanges();
    document.body.removeChild(tempDiv);

    if (!success) {
        // Final fallback to plain text
        const textarea = document.createElement('textarea');
        textarea.value = plainText;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success ? 'text (legacy)' : null;
    }

    return 'HTML (legacy)';
};

// Main copy function
const copyGoalToClipboard = async (goal, workingGroupName) => {
    const html = generateGoalHTML(goal, workingGroupName);
    const plainText = `Goal ${goal.goal?.properties?.goal_number}: ${goal.goal?.properties?.name}\n\n` +
        goal.indicators.map((indicator) => {
            const compositeKey = indicator.indicator?.properties?.composite_key;
            const indicatorNumber = compositeKey?.split('-')[0]?.split('.')[1];
            const description = indicator.indicator?.properties?.success_indicator || '';
            const baseUrl = window.location.origin;
            const [numbers, suffix] = compositeKey.split('-');
            const [gNum, iNum] = numbers.split('.');
            const workingGroupMap = {'web': 'web', 'pro': 'procurement', 'ins': 'instructional-materials'};
            const workingGroupSegment = workingGroupMap[suffix] || suffix;
            const viewUrl = `${baseUrl}/dashboard/reports/${workingGroupSegment}/${gNum}/${iNum}`;
            const directLinkUrl = `${baseUrl}/dashboard/reports#${compositeKey}`;
            return `${goal.goal?.properties?.goal_number}.${indicatorNumber} - ${description}\nView: ${viewUrl}\nDirect Link: ${directLinkUrl}`;
        }).join('\n\n');

    let copiedFormat = null;
    let errorMessage = null;

    // Method 1: Try modern Clipboard API first (works in Chrome, Edge, Safari 13.1+)
    try {
        // Check if we're in a secure context (HTTPS or localhost)
        if (window.isSecureContext && navigator.clipboard && navigator.clipboard.write) {
            copiedFormat = await copyHTMLToClipboard(html, plainText);
            console.log('Successfully copied HTML using Clipboard API');
        }
    } catch (err) {
        console.log('Clipboard API failed:', err);
        errorMessage = err.message;
    }

    // Method 2: Try execCommand fallback
    if (!copiedFormat) {
        try {
            copiedFormat = copyWithExecCommand(html, plainText);
            if (copiedFormat) {
                console.log('Successfully copied using execCommand');
            }
        } catch (err) {
            console.log('execCommand failed:', err);
            errorMessage = err.message;
        }
    }

    // Method 3: Final fallback - just copy plain text
    if (!copiedFormat && navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(plainText);
            copiedFormat = 'text';
            console.log('Successfully copied plain text');
        } catch (err) {
            console.log('Plain text copy failed:', err);
            errorMessage = err.message;
        }
    }

    // Show result to user
    if (copiedFormat) {
        toast({
            title: 'Copied to clipboard',
            description: `Goal ${goal.goal?.properties?.goal_number} (${copiedFormat})`,
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top'
        });
    } else {
        toast({
            title: 'Copy failed',
            description: errorMessage || 'Unable to copy to clipboard. Please try selecting and copying manually.',
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top'
        });

        // Log for debugging
        console.error('All copy methods failed. Error:', errorMessage);
        console.log('HTML content:', html);
        console.log('Plain text content:', plainText);
    }
};