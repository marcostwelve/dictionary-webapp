const wrapper = document.querySelector('.wrapper');
searchInput = wrapper.querySelector('input');
infoText = wrapper.querySelector('.info-text');
nearWords = wrapper.querySelector('.synonyms .list');
removeIcon = wrapper.querySelector('.search span');
speakBtn = wrapper.querySelector('.word i');


searchInput.addEventListener('keyup', (e) => {
    if (e.key == 'Enter' && e.target.value) {
        fetchApi(e.target.value);
        fetchNearWords(e.target.value);
    }

    if (searchInput.value == "") {
        searchInput.value = '';
        searchInput.focus();
        wrapper.classList.remove('active');
        infoText.textContent = 'Escreva a palavra que deseja pesquisar e aperte enter.';
    }
});

removeIcon.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    wrapper.classList.remove('active');
    infoText.textContent = 'Escreva a palavra que deseja pesquisar e aperte enter.';
});

speakBtn.addEventListener('click', () => {
    const word = document.querySelector('.search input').value;

    if (word) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'pt-BR';
        window.speechSynthesis.speak(utterance);
    } else {
        alert('Por favor, escreva uma palavra para ouvir a pronúncia.');
    }
});

async function fetchApi(word) {
    let wordFormated = word.toLowerCase().trim();
    wrapper.classList.remove('active');
    infoText.style.color = '#000';
    infoText.innerHTML = `Pesquisando a palavra <span>"${wordFormated}..."</span>`;
    let url = `https://dictionayapi-bffwf8fsa7b8a3fm.eastus-01.azurewebsites.net/jsonformat/${wordFormated}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Palavra não encontrada');
        }

        const data = await response.json();

        const filteredData = extractSections(data);

        if (filteredData) {
                infoText.innerHTML = "";
                wrapper.classList.add('active');
                 document.querySelector('.word p').textContent = data.query.pages[Object.keys(data.query.pages)[0]].title;
                 document.querySelector('.word span').textContent = "";
                 document.querySelector('.content p').textContent = filteredData;
        }
    } catch (error) {
        infoText.style.color = '#ff0000';
        infoText.textContent = error;
        return;
    }
}

function searchNearword(word) {
    let wordFormated = word.toLowerCase().trim();
    wrapper.classList.remove('active');
    searchInput.value = word;
    fetchApi(wordFormated);
}

function fetchNearWords(word) {
    let wordFormated = word.toLowerCase().trim();
    let url = `https://api.dicionario-aberto.net/near/${wordFormated}`;

    fetch(url)
    .then(response => response.json())
    .then(result => {
        if (!Array.isArray(result) || result.length == 0) {
            nearWords.parentElement.style.display = 'none';
        } else {
            nearWords.parentElement.style.display = 'block';
            nearWords.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                let tag = `<span onclick="searchNearword('${result[i]}')">${result[i]},</span> `

                nearWords.insertAdjacentHTML('beforeend', tag);
            }
        }
    })
    .catch(error => {
        console.error('Erro ao buscar palavras próximas', error);
    });
}

function clearSpecilaChars(word) {
    return word.replace(/<[^>]*>/g, '')
                .replace(/[^\w\sáéíóúàãõç]/gi, '')
                .replace(/[-_]/g, ' ');
}

function extractSections(data) {

    const extract = data.query.pages[Object.keys(data.query.pages)[0]].extract;
    const textArray = extract.split('\n');

    let adjectivePart = [];
    let synonymsPart = [];
    let substantivesPart = [];
    let interjectionPart = [];
    let captureAdjective = false;
    let captureSynonyms = false;
    let captureSubstantives = false;
    let captureInterjection = false;

    textArray.forEach(line => {
        if (line.includes('== Adjetivo ==')) {
            captureAdjective = true;
            captureSynonyms = false;
            captureSubstantives = false;
        } else if (line.includes('== Sinônimos ==')) {
            captureAdjective = false;
            captureSynonyms = true;
            captureSubstantives = false;
        } else if (line.includes('== Substantivo ==')) {
            captureAdjective = false;
            captureSynonyms = false;
            captureSubstantives = true;
        } else if (line.includes('== Interjeição ==')) {
            captureAdjective = false;
            captureSynonyms = false;
            captureSubstantives = false;
            captureInterjection = true;
        }

        if (captureAdjective && line.trim() != '') {
            adjectivePart.push(line.trim());
        } else if (captureSynonyms && line.trim() != '') {
            synonymsPart.push(line.trim());
        } else if (captureSubstantives && line.trim() != '') {
            substantivesPart.push(line.trim());
        } else if (captureInterjection && line.trim() != '') {
            interjectionPart.push(line.trim());
        }
    });

    adjectivePart = adjectivePart.filter(line => !line.startsWith('=') && line !== '');
    synonymsPart = synonymsPart.filter(line => !line.startsWith('=') && line !== '');
    substantivesPart = substantivesPart.filter(line => !line.startsWith('=') && line !== '');
    interjectionPart = interjectionPart.filter(line => !line.startsWith('=') && line !== '');

    let result = "";

    // if (synonymsPart.length > 0) {
    //     result += synonymsPart;
    // }

    if (substantivesPart.length > 0 && interjectionPart.length == 0) {
        result += substantivesPart;
    }

    if (interjectionPart.length > 0 && substantivesPart.length == 0) {
        result += interjectionPart;
    }

    return result || 'Seções de Adjetivo e Sinônimos não encontradas';
    
}
