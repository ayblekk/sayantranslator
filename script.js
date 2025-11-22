document.addEventListener('DOMContentLoaded', () => {
    const sourceText = document.getElementById('source-text');
    const targetText = document.getElementById('target-text');
    const sourceLang = document.getElementById('source-lang');
    const targetLang = document.getElementById('target-lang');
    const translateBtn = document.getElementById('translate-btn');
    const swapBtn = document.getElementById('swap-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');

    const apiKey = 'YOUR_API_KEY_HERE'; // TODO: Replace with your actual Perplexity API key

    // Auto-resize Textarea
    function autoResize(element) {
        element.style.height = 'auto';
        element.style.height = element.scrollHeight + 'px';
    }

    // Perplexity API Translation Function
    async function fetchTranslation(text, source, target) {

        const systemPrompt = `You are a strict translation engine. Translate the input text to ${target}. Return ONLY the translated text. Do not define, explain, or search for the text. If it's a single word, return a single word.`;

        const url = 'https://api.perplexity.ai/chat/completions';
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 0
            })
        };

        console.log("--- [API CALL] ---");
        console.log("URL:", url);
        console.log("------------------");

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    async function handleTranslation() {
        const text = sourceText.value.trim();
        if (!text) return;

        // UI State: Loading
        translateBtn.disabled = true;
        translateBtn.textContent = 'Translating...';
        loadingSpinner.style.display = 'flex';
        targetText.value = ''; // Clear previous result
        autoResize(targetText);

        try {
            const targetCode = targetLang.value;
            const sourceCode = sourceLang.value;

            const result = await fetchTranslation(text, sourceCode, targetCode);

            // Decode HTML entities if needed (basic check)
            const decodedResult = new DOMParser().parseFromString(result, "text/html").documentElement.textContent;

            targetText.value = decodedResult;
            autoResize(targetText);
        } catch (error) {
            console.error("Translation failed:", error);
            targetText.value = `Error: ${error.message}`;
            autoResize(targetText);
        } finally {
            // UI State: Reset
            translateBtn.disabled = false;
            translateBtn.textContent = 'Translate';
            loadingSpinner.style.display = 'none';
        }
    }

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Event Listeners

    translateBtn.addEventListener('click', handleTranslation);

    swapBtn.addEventListener('click', () => {
        // Swap Languages
        const tempLang = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = tempLang;

        // Swap Text
        const tempText = sourceText.value;
        sourceText.value = targetText.value;
        targetText.value = ''; // Clear target

        // Trigger resize
        autoResize(sourceText);
        autoResize(targetText);

        // Update Clear Button visibility
        clearBtn.style.display = sourceText.value ? 'flex' : 'none';
    });

    // Allow Ctrl+Enter to translate
    sourceText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleTranslation();
        }
    });

    sourceText.addEventListener('input', function () {
        clearBtn.style.display = this.value ? 'flex' : 'none';
        autoResize(this);
    });

    // Initial resize
    autoResize(sourceText);
    autoResize(targetText);

    clearBtn.addEventListener('click', () => {
        sourceText.value = '';
        targetText.value = '';
        sourceText.focus();
        clearBtn.style.display = 'none';
        autoResize(sourceText);
    });

    copyBtn.addEventListener('click', async () => {
        if (!targetText.value) return;

        try {
            await navigator.clipboard.writeText(targetText.value);
            showToast();

            // Visual feedback
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });
});
