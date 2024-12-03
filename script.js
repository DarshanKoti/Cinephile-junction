const API_KEY = '1cf50e6248dc270629e802686245c2c8';
const YOUTUBE_API_KEY = 'AIzaSyCrDF5UP3ZbIoFquGX_g6blIbgF7dIJvR0';
const selectedGenres = [];

// Initialize year dropdown
const currentYear = new Date().getFullYear();
const yearSelect = document.getElementById("year");
for (let year = currentYear; year >= 1900; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
}

// Rating slider event listener
document.getElementById("rating").addEventListener("input", function() {
    document.getElementById("ratingValue").textContent = this.value + "+";
});

// Genre selection handling
document.getElementById("genreSelect").addEventListener("change", function() {
    const genreId = this.value;
    const genreName = this.options[this.selectedIndex].text;
    if (genreId && !selectedGenres.some(g => g.id === genreId)) {
        selectedGenres.push({ id: genreId, name: genreName });
        updateSelectedGenres();
    }
});

function updateSelectedGenres() {
    const selectedGenresContainer = document.getElementById("selectedGenres");
    selectedGenresContainer.innerHTML = "";
    selectedGenres.forEach(genre => {
        const genreBadge = document.createElement("span");
        genreBadge.className = "genre-badge";
        genreBadge.textContent = genre.name;
        genreBadge.onclick = () => {
            selectedGenres.splice(selectedGenres.indexOf(genre), 1);
            updateSelectedGenres();
        };
        selectedGenresContainer.appendChild(genreBadge);
    });
}

async function getRandomMovie() {
    document.getElementById('loading').style.display = 'flex';

    const genres = selectedGenres.map(genre => genre.id).join(',');
    const year = document.getElementById('year').value;
    const minRating = document.getElementById('rating').value;

    try {
        const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
            params: {
                api_key: API_KEY,
                with_genres: genres,
                primary_release_year: year,
                'vote_average.gte': minRating,
                sort_by: 'vote_count.desc',
                page: Math.floor(Math.random() * 5) + 1
            }
        });

        if (response.data.results.length > 0) {
            const randomIndex = Math.floor(Math.random() * response.data.results.length);
            const movie = response.data.results[randomIndex];

            // Fetch additional movie details
            const [movieDetails, credits] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
                    params: { api_key: API_KEY }
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/credits`, {
                    params: { api_key: API_KEY }
                })
            ]);

            // Display movie details
            document.getElementById('result').style.display = 'block';
            document.getElementById('movieTitle').textContent = movie.title;
            document.getElementById('movieYear').textContent = movie.release_date.split("-")[0];
            document.getElementById('movieRuntime').textContent = movieDetails.data.runtime ? `${movieDetails.data.runtime} mins` : 'N/A';
            document.getElementById('movieRating').textContent = `${movie.vote_average.toFixed(1)}/10`;
            document.getElementById('movieOverview').textContent = movie.overview || "No overview available.";
            document.getElementById('movieReleaseDate').textContent = movie.release_date || 'N/A';
            document.getElementById('movieBudget').textContent = movieDetails.data.budget ? `$${movieDetails.data.budget.toLocaleString()}` : 'N/A';
            document.getElementById('movieRevenue').textContent = movieDetails.data.revenue ? `$${movieDetails.data.revenue.toLocaleString()}` : 'N/A';

            // Set movie poster
            const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/api/placeholder/300/450";
            document.getElementById('moviePoster').src = posterUrl;

            // Display cast
            displayCast(credits.data.cast.slice(0, 4));

        } else {
            alert("No movies found based on your preferences. Try adjusting the filters!");
        }
    } catch (error) {
        console.error("Error fetching movie:", error);
        alert("An error occurred while fetching the movie. Please try again later.");
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function displayCast(cast) {
    const castGrid = document.getElementById('castGrid');
    castGrid.innerHTML = '';

    cast.forEach(member => {
        const castCard = document.createElement('div');
        castCard.className = 'cast-card';

        const profilePath = member.profile_path
            ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
            : '/api/placeholder/185/278';

        castCard.innerHTML = `
            <img src="${profilePath}" alt="${member.name}" class="cast-image">
            <div class="cast-info">
                <div class="cast-name">${member.name}</div>
                <div class="cast-character">${member.character}</div>
            </div>
        `;

        castGrid.appendChild(castCard);
    });
}

async function watchTrailer() {
    const movieTitle = document.getElementById('movieTitle').textContent;
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                key: YOUTUBE_API_KEY,
                type: 'video',
                part: 'id,snippet',
                maxResults: 1,
                q: `${movieTitle} trailer`
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            const trailerId = response.data.items[0].id.videoId;
            const trailerUrl = `https://www.youtube.com/watch?v=${trailerId}`;
            window.open(trailerUrl, '_blank');
        } else {
            alert("No trailer found for this movie.");
        }
    } catch (error) {
        console.error("Error fetching trailer:", error);
        alert("An error occurred while fetching the trailer. Please try again later.");
    }
}