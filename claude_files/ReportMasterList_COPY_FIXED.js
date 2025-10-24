// FIXED: Replace the copyGoalToClipboard function with this version
// This works in both development and production environments

    // Function to copy goal group to clipboard (COMPATIBLE VERSION)
    const copyGoalToClipboard = async (goal, workingGroupName) => {
        try {
            const html = generateGoalHTML(goal, workingGroupName);
            const plainText = `Goal ${goal.goal?.properties?.goal_number}: ${goal.goal?.properties?.name}\n\n` +
                goal.indicators.map((indicator) => {
                    const compositeKey = indicator.indicator?.properties?.composite_key;
                    const indicatorNumber = compositeKey?.split('-')[0]?.split('.')[1];
                    const description = indicator.indicator?.properties?.success_indicator || '';
                    return `${goal.goal?.properties?.goal_number}.${indicatorNumber} - ${description}`;
                }).join('\n');

            // Try modern Clipboard API with HTML (if supported)
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    const blob = new Blob([html], { type: 'text/html' });
                    const textBlob = new Blob([plainText], { type: 'text/plain' });
                    const clipboardItem = new ClipboardItem({
                        'text/html': blob,
                        'text/plain': textBlob
                    });
                    await navigator.clipboard.write([clipboardItem]);
                } catch (e) {
                    // Fallback if HTML writing fails
                    await navigator.clipboard.writeText(plainText);
                }
            }
            // Fallback: Use older method for better compatibility
            else if (navigator.clipboard) {
                await navigator.clipboard.writeText(plainText);
            }
            // Last resort: Use execCommand (deprecated but widely supported)
            else {
                const textarea = document.createElement('textarea');
                textarea.value = plainText;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            toast({
                title: 'Copied to clipboard',
                description: `Goal ${goal.goal?.properties?.goal_number} copied`,
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top'
            });
        } catch (error) {
            console.error('Failed to copy:', error);

            // Final fallback: Show the user a modal with text to copy manually
            const plainText = `Goal ${goal.goal?.properties?.goal_number}: ${goal.goal?.properties?.name}\n\n` +
                goal.indicators.map((indicator) => {
                    const compositeKey = indicator.indicator?.properties?.composite_key;
                    const indicatorNumber = compositeKey?.split('-')[0]?.split('.')[1];
                    const description = indicator.indicator?.properties?.success_indicator || '';
                    return `${goal.goal?.properties?.goal_number}.${indicatorNumber} - ${description}`;
                }).join('\n');

            toast({
                title: 'Copy failed',
                description: 'Please use Ctrl+C to copy manually',
                status: 'warning',
                duration: 5000,
                isClosable: true,
                position: 'top'
            });
        }
    };
