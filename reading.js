$(document).ready(function() {
    let fontSize = 16;
    const textContent = $('#textContent');
    const textInput = $('#textInput');
    const fileInput = $('#fileInput');
    const analyzeButton = $('#analyzeButton');
    const analysisResult = $('#analysisResult');
    const playPauseButton = $('#playPauseButton');
    const speedControl = $('#speedControl');
    const speedValue = $('#speedValue');
    const imageUpload = $('#imageUpload');
    const performOCRButton = $('#performOCR');

    let speech = null;
    let currentWord = 0;
    let words = [];
    let isPlaying = false;

    // File input handling
    fileInput.change((e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                textInput.val(e.target.result);
                updateTextContent(e.target.result);
            };
            reader.readAsText(file);
        }
    });

    // Analyze button click handler
    analyzeButton.click(() => {
        const text = textInput.val();
        if (text) {
            analyzeText(text);
        } else {
            alert('Please enter or upload some text first.');
        }
    });

    // Text-to-Speech and Word Highlighting
    function updateTextContent(text) {
        words = text.split(/\s+/);
        textContent.empty();
        words.forEach((word, index) => {
            textContent.append($('<span>')
                .text(word + ' ')
                .attr('id', 'word-' + index)
                .addClass('clickable-word')
                .click(function() {
                    lookupWord(word);
                })
            );
        });
        currentWord = 0;
    }

    playPauseButton.click(() => {
        const text = textInput.val();
        if (!text) {
            alert('Please enter some text before playing.');
            return;
        }

        if (!speech || speech.text !== text) {
            window.speechSynthesis.cancel();
            speech = new SpeechSynthesisUtterance(text);
            speech.onboundary = function(event) {
                if (event.name === 'word') {
                    highlightWord(currentWord);
                    currentWord++;
                }
            };
            speech.onend = function() {
                isPlaying = false;
                playPauseButton.text('Play');
                currentWord = 0;
            };
        }

        if (!isPlaying) {
            speech.rate = parseFloat(speedControl.val());
            window.speechSynthesis.speak(speech);
            isPlaying = true;
            playPauseButton.text('Pause');
        } else {
            window.speechSynthesis.pause();
            isPlaying = false;
            playPauseButton.text('Resume');
        }
    });

    speedControl.on('input', function() {
        const speed = $(this).val();
        speedValue.text(speed + 'x');
        if (speech) {
            speech.rate = parseFloat(speed);
        }
    });

    function highlightWord(index) {
        $('.highlighted').removeClass('highlighted');
        $('#word-' + index).addClass('highlighted');
    }

    // Text analysis function using Gemini API
    async function analyzeText(text) {
        const API_KEY = 'AIzaSyDPdIiA9uFLZXG8s92ankQzOLyQAOO-DEo';
        const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

        const requestBody = {
            contents: [{
                parts: [{
                    text: `Do changes to this text to be helpful to dyslexia users, make it easier for them to read and understand, avoid any unnecessary formatting of text, and also remember that the text will be directly presented to the dyslexia readers. Here's the text. avoid saying sure hetes the modified text or similar things, heres the text -:

${text}

Please provide the modified text along with a brief explanation of the changes made.`
                }]
            }]
        };

        try {
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const analysis = data.candidates[0].content.parts[0].text;

            analysisResult.html(`
                <h3>Text Analysis for Dyslexic Readers</h3>
                <div class="analysis-content">${createClickableWords(analysis)}</div>
            `);
        } catch (error) {
            console.error('Error:', error);
            analysisResult.html(`
                <h3>Text Analysis</h3>
                <p>An error occurred while analyzing the text. Please try again later.</p>
            `);
        }
    }

    // New function to create clickable words
    function createClickableWords(text) {
        return text.split(/\s+/).map((word, index) => {
            return `<span class="clickable-word" id="analysis-word-${index}">${word}</span>`;
        }).join(' ');
    }

    // Dictionary/thesaurus lookup
    async function lookupWord(word) {
        const API_KEY = 'AIzaSyDPdIiA9uFLZXG8s92ankQzOLyQAOO-DEo';
        const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

        const requestBody = {
            contents: [{
                parts: [{
                    text: `Provide a concise definition and a few synonyms for the word "${word}".`
                }]
            }]
        };

        try {
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const result = data.candidates[0].content.parts[0].text;

            // Create and show a tooltip with the result
            $('<div>')
                .addClass('word-tooltip')
                .html(result)
                .appendTo('body')
                .css({
                    top: event.pageY + 10,
                    left: event.pageX + 10
                })
                .fadeIn('fast');

            // Remove the tooltip when clicking outside
            $(document).one('click', function(e) {
                if (!$(e.target).closest('.word-tooltip').length) {
                    $('.word-tooltip').remove();
                }
            });

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while looking up the word. Please try again later.');
        }
    }

    // OCR functionality
    performOCRButton.click(() => {
        const file = imageUpload[0].files[0];
        if (file) {
            performOCR(file);
        } else {
            alert('Please upload an image first.');
        }
    });

    async function performOCR(imageFile) {
        const worker = await Tesseract.createWorker('eng');
        try {
            const { data: { text } } = await worker.recognize(imageFile);
            textInput.val(text);
            updateTextContent(text);
        } catch (error) {
            console.error('OCR Error:', error);
            alert('An error occurred while performing OCR. Please try again.');
        } finally {
            await worker.terminate();
        }
    }

    // Dark mode toggle
    $('#colorScheme').change(function() {
        switch($(this).val()) {
            case 'default':
                $('body').removeClass('dark-mode sepia-mode');
                break;
            case 'darkMode':
                $('body').addClass('dark-mode').removeClass('sepia-mode');
                break;
            case 'sepia':
                $('body').addClass('sepia-mode').removeClass('dark-mode');
                break;
        }
    });

    // Font size controls
    $('#increaseFontSize').click(function() {
        fontSize += 2;
        textContent.css('font-size', fontSize + 'px');
    });

    $('#decreaseFontSize').click(function() {
        fontSize = Math.max(12, fontSize - 2);
        textContent.css('font-size', fontSize + 'px');
    });

    // Line spacing control
    $('#lineSpacing').change(function() {
        textContent.css('line-height', $(this).val());
    });

    // Speech-to-text functionality
    const startSpeechToTextButton = $('#startSpeechToText');
    let recognition;

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = function(event) {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                textInput.val(textInput.val() + ' ' + finalTranscript);
                updateTextContent(textInput.val());
            }
        };

        startSpeechToTextButton.click(function() {
            if ($(this).text() === 'Start Speech-to-Text') {
                recognition.start();
                $(this).text('Stop Speech-to-Text');
            } else {
                recognition.stop();
                $(this).text('Start Speech-to-Text');
            }
        });
    } else {
        startSpeechToTextButton.prop('disabled', true).text('Speech-to-Text not supported');
    }

    // Dyslexia-friendly font toggle
    $('#toggleDyslexiaFont').click(function() {
        $('body').toggleClass('dyslexia-friendly');
        $(this).text($('body').hasClass('dyslexia-friendly') ? 'Disable Dyslexia Font' : 'Enable Dyslexia Font');
    });

    // Add event delegation for clickable words in the analysis result
    $(document).on('click', '.analysis-content .clickable-word', function() {
        lookupWord($(this).text());
    });

    // Initialize (without welcome message)
    updateTextContent(textInput.val() || '');
});