    // Function to copy goal group to clipboard (DEBUGGED VERSION)
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

        let copiedFormat = 'text';

        try {
            // Check if we have ClipboardItem support
            if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
                console.log('ClipboardItem is supported, attempting HTML copy...');

                try {
                    // Create blobs for both formats
                    const htmlBlob = new Blob([html], { type: 'text/html' });
                    const textBlob = new Blob([plainText], { type: 'text/plain' });

                    // Create ClipboardItem
                    const item = new ClipboardItem({
                        'text/html': htmlBlob,
                        'text/plain': textBlob
                    });

                    // Write to clipboard
                    await navigator.clipboard.write([item]);
                    copiedFormat = 'HTML';
                    console.log('Successfully copied as HTML');
                } catch (htmlError) {
                    console.error('HTML copy failed, trying text only:', htmlError);
                    // If HTML fails, try text
                    await navigator.clipboard.writeText(plainText);
                    copiedFormat = 'text (HTML failed)';
                }
            }
            // Fallback to text-only modern API
            else if (navigator.clipboard && navigator.clipboard.writeText) {
                console.log('Using text-only clipboard API');
                await navigator.clipboard.writeText(plainText);
                copiedFormat = 'text (no ClipboardItem)';
            }
            // Last resort: execCommand
            else {
                console.log('Using legacy execCommand');
                const textarea = document.createElement('textarea');
                textarea.value = plainText;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (!success) throw new Error('execCommand failed');
                copiedFormat = 'text (legacy)';
            }

            toast({
                title: 'Copied to clipboard',
                description: `Goal ${goal.goal?.properties?.goal_number} (${copiedFormat})`,
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top'
            });
        } catch (error) {
            console.error('All copy methods failed:', error);
            toast({
                title: 'Copy failed',
                description: error.message || 'Unable to copy to clipboard',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'top'
            });
        }
    };
