// Finding book in google books api
const addBookTitle = document.querySelector('.add-info #book-title')
const matchList = document.querySelector('.match-list')


const searchTitles = async searchText => {
    const res = await fetch('https://www.googleapis.com/books/v1/volumes?q=' + addBookTitle.value)
    const titles = await res.json()

    let matches = titles.items.filter(item => {
        const regex = new RegExp(`^${searchText}`, 'gi')
        return item.volumeInfo.title.match(regex)
    })

    if (searchText.length === 0) {
        matches = []
        matchList.innerHTML = ''
    }

    outputHtml(matches)
}

const outputHtml = matches => {
    if (matches.length > 0) {
        const html = matches.map(match => `
        <div class="match">
            <div class="match-cover">
                <img src="${match.volumeInfo.imageLinks.thumbnail}" alt="${match.volumeInfo.title} COVER UNAVAILABLE">
            </div>

            <div class="match-info">
                <p class="match-info-title">${match.volumeInfo.title}</p>
                <p class="match-info-author"><strong>By:</strong> ${match.volumeInfo.authors}</p>
            </div>
        </div>`).join('')
        matchList.innerHTML = html
    }
}

addBookTitle.addEventListener('input', () => searchTitles(addBookTitle.value))