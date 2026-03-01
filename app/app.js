import { h, render } from 'https://esm.sh/preact';
import { useState, useEffect, useMemo, useRef } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

const html = htm.bind(h);

const KEYBOARD_LAYOUT = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

const BASE_LETTERS = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z'
};

// --- TTS Helper ---
const speak = (text, onEnd) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
};

// --- Components ---

const Spinner = () => html`
    <div class="center-message">
        <div class="spinner"></div>
        <div>Ładowanie...</div>
    </div>
`;

const EmptyState = () => html`
    <div class="center-message">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <div>Brak elementów.</div>
    </div>
`;

const ErrorState = ({ message }) => html`
    <div class="center-message">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <div>${message}</div>
    </div>
`;

const SpeakingIndicator = ({ visible }) => html`
    <div class="speaking-indicator ${visible ? 'visible' : ''}">
        <div class="pulse"></div>
        <span>Mówię...</span>
    </div>
`;

// New Top Bar Component
const TopBar = ({ path, sentence, onBack, onRemoveWord, onReadSentence }) => {
    const isRoot = path.length === 0;
    
    // Auto-scroll to end of sentence
    const sentenceRef = useRef(null);
    useEffect(() => {
        if (sentenceRef.current) {
            sentenceRef.current.scrollLeft = sentenceRef.current.scrollWidth;
        }
    }, [sentence]);

    return html`
        <div class="header" style="padding: 12px; gap: 12px; display: flex; align-items: stretch;">
            <!-- Start/Back Button -->
            <button class="back-btn ${isRoot ? 'hidden' : ''}" 
                    onClick=${onBack}
                    style="flex-shrink: 0; min-width: 60px; justify-content: center; opacity: ${isRoot ? 0 : 1}; pointer-events: ${isRoot ? 'none' : 'auto'}">
                <span>←</span>
            </button>

            <!-- Sentence Display -->
            <div class="sentence-display" 
                 onClick=${onReadSentence}
                 ref=${sentenceRef}
                 style="flex: 1; background: #f0f4f8; border-radius: 12px; padding: 0 16px; display: flex; align-items: center; overflow-x: auto; white-space: nowrap; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;">
                ${sentence.length === 0 
                    ? html`<span style="color: #99aab5; font-style: italic;">Zdanie...</span>`
                    : sentence.map((word, i) => html`
                        <span style="background: white; padding: 4px 8px; border-radius: 6px; margin-right: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-weight: 600;">
                            ${word}
                        </span>
                    `)
                }
            </div>

            <!-- Remove Word Button -->
            <button class="back-btn" 
                    onClick=${onRemoveWord}
                    disabled=${sentence.length === 0}
                    style="flex-shrink: 0; min-width: 60px; justify-content: center; background: #ffebee; color: #ef5350; opacity: ${sentence.length === 0 ? 0.5 : 1};">
                <span>⌫</span>
            </button>
        </div>
    `;
};

const GridItem = ({ item, index, onClick }) => {
    const hasChildren = item.has_children && item.children;
    const isWord = item.is_word;
    const type = hasChildren ? 'category' : (isWord ? 'word' : 'none');
    const badge = type === 'category' ? '→' : (type === 'word' ? '♪' : null);

    return html`
        <div class="grid-item ${type} fade-in" 
             style="animation-delay: ${index * 0.02}s"
             onClick=${() => onClick(item)}>
            ${badge && html`<div class="grid-item-badge ${type}">${badge}</div>`}
            <div class="grid-item-text">${item.syllable}${type === 'category' ? '-' : ''}</div>
        </div>
    `;
};

const KeyboardKey = ({ letter, onClick, disabled }) => html`
    <div class="grid-item category ${disabled ? 'disabled' : ''}" 
         onClick=${() => !disabled && onClick(letter)} 
         style="min-height: 80px; ${disabled ? 'opacity: 0.5; cursor: not-allowed; background: #e0e0e0;' : ''}">
        <div class="grid-item-text" style="text-transform: uppercase;">${letter}</div>
    </div>
`;

const KeyboardView = ({ onSelect, availableLetters }) => html`
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
        ${KEYBOARD_LAYOUT.map(row => html`
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                ${row.map(letter => {
                    const isDisabled = !availableLetters.has(letter);
                    return html`
                        <div style="flex: 1; min-width: 40px; max-width: 80px;">
                            <${KeyboardKey} letter=${letter} onClick=${onSelect} disabled=${isDisabled} />
                        </div>
                    `;
                })}
            </div>
        `)}
    </div>
`;

const App = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [path, setPath] = useState([]); 
    const [speaking, setSpeaking] = useState(false);
    const [sentence, setSentence] = useState([]);

    useEffect(() => {
        fetch('data.json')
            .then(r => r.json())
            .then(setData)
            .catch(err => {
                console.error(err);
                setError('Nie udało się załadować danych.');
            })
            .finally(() => setLoading(false));
    }, []);

    const availableLetters = useMemo(() => {
        const letters = new Set();
        data.forEach(item => {
            const firstChar = item.syllable.charAt(0).toLowerCase();
            letters.add(BASE_LETTERS[firstChar] || firstChar);
            if (!BASE_LETTERS[firstChar]) letters.add(firstChar); 
        });
        return letters;
    }, [data]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Backspace') {
                if (path.length > 0) setPath(p => p.slice(0, -1));
                else if (sentence.length > 0) setSentence(s => s.slice(0, -1));
            }
            if (e.key === 'Escape') setPath([]);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [path, sentence]);

    const currentItems = useMemo(() => {
        if (path.length === 0) return null;

        if (path.length === 1 && path[0].isFilter) {
            const letter = path[0].syllable;
            return data.filter(item => {
                const firstChar = item.syllable.charAt(0).toLowerCase();
                const baseChar = BASE_LETTERS[firstChar] || firstChar;
                return baseChar === letter;
            }).sort((a, b) => b.weight - a.weight);
        }

        let items = data;
        if (path[0].isFilter) {
             const letter = path[0].syllable;
             items = data.filter(item => {
                const firstChar = item.syllable.charAt(0).toLowerCase();
                const baseChar = BASE_LETTERS[firstChar] || firstChar;
                return baseChar === letter;
            });
        }

        for (let i = 1; i < path.length; i++) {
            const segment = path[i];
            if (segment.children) items = segment.children;
        }
        return [...(items || [])].sort((a, b) => b.weight - a.weight);
    }, [data, path]);

    const handleBack = () => {
        if (path.length > 0) setPath(p => p.slice(0, -1));
    };

    const handleKeyboardSelect = (letter) => {
        setPath([{ syllable: letter, isFilter: true }]);
    };

    const handleItemClick = (item) => {
        if (item.has_children && item.children) {
            setPath([...path, item]);
        } else if (item.is_word && item.full_word) {
            setPath([]); // Reset to root
            setSentence(s => [...s, item.full_word]); // Add to sentence
            
            setTimeout(() => {
                setSpeaking(true);
                speak(item.full_word, () => setSpeaking(false));
            }, 100);
        }
    };

    const handleRemoveWord = () => {
        setSentence(s => s.slice(0, -1));
    };

    const handleReadSentence = () => {
        if (sentence.length === 0) return;
        setSpeaking(true);
        speak(sentence.join(' '), () => setSpeaking(false));
    };

    if (loading) return html`<${Spinner} />`;
    if (error) return html`<${ErrorState} message=${error} />`;

    return html`
        <div class="app-container">
            <${TopBar} 
                path=${path} 
                sentence=${sentence}
                onBack=${handleBack}
                onRemoveWord=${handleRemoveWord}
                onReadSentence=${handleReadSentence}
            />

            <main class="grid-container" style="${path.length === 0 ? 'display: flex; flex-direction: column;' : ''}">
                ${path.length === 0 
                    ? html`<${KeyboardView} onSelect=${handleKeyboardSelect} availableLetters=${availableLetters} />`
                    : (currentItems.length === 0 
                        ? html`<${EmptyState} />`
                        : currentItems.map((item, index) => html`
                            <${GridItem} 
                                key=${item.syllable + index} 
                                item=${item} 
                                index=${index} 
                                onClick=${handleItemClick} 
                            />
                        `)
                    )
                }
            </main>

            <${SpeakingIndicator} visible=${speaking} />
        </div>
    `;
};

render(html`<${App} />`, document.getElementById('app'));
