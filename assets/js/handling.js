
document.addEventListener('DOMContentLoaded', () => {
  const moviesList = document.querySelector('.movies-list');

  const fetchUpcoming = async (url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      const items = data.results.slice(0, 8);  // Fetch 8 upcoming movies
      const detailedMovies = await fetchMovieDetails(items);
      displayItems(detailedMovies);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchMovieDetails = async (movies) => {
    const detailedMovies = await Promise.all(movies.map(async movie => {
      const response = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&append_to_response=release_dates`);
      const detailedMovie = await response.json();
      detailedMovie.certification = getCertification(detailedMovie);
      return detailedMovie;
    }));
    return detailedMovies;
  };

  const getCertification = (movie) => {
    const userLanguage = navigator.language.split('-')[0]; // Get the language code (e.g., 'en' or 'cs')

    if (movie.release_dates && movie.release_dates.results) {
      let certification = 'NR'; // Default to 'NR' if no certification is found

      // Determine which certification to use based on the user's preferred language
      let releaseInfo;
      if (userLanguage === 'cs') {
        // Czech language, use certification data for Czech Republic ('CZ')
        releaseInfo = movie.release_dates.results.find(country => country.iso_3166_1 === 'CZ');
      } else {
        // Default to English language, use certification data for United States ('US')
        releaseInfo = movie.release_dates.results.find(country => country.iso_3166_1 === 'US');
      }

      if (releaseInfo && releaseInfo.release_dates && releaseInfo.release_dates.length > 0) {
        certification = releaseInfo.release_dates[0].certification;
      }

      if (certification) {
        // Map the certification codes to their respective ratings
        switch (certification) {
          case 'NR':
            return { rating: 'NR', hint: 'Not Rated' };
          case 'G':
            return { rating: 'G', hint: 'General Audiences. All ages admitted.' };
          case 'PG':
            return { rating: 'PG', hint: 'Parental Guidance Suggested. Some material may not be suitable for children.' };
          case 'PG-13':
            return { rating: 'PG-13', hint: 'Parents Strongly Cautioned. Some material may be inappropriate for children under 13.' };
          case 'R':
            return { rating: 'R', hint: 'Restricted. Under 17 requires accompanying parent or adult guardian.' };
          case 'NC-17':
            return { rating: 'NC-17', hint: 'No One 17 and Under Admitted.' };
          case 'U':
            return { rating: 'U', hint: 'Universal. Suitable for all ages.' }; // Map 'U' to 'G'
          default:
            return { rating: certification, hint: 'Rating Description Unavailable' };
        }
      }
    }
    return { rating: 'NR', hint: 'Not Rated' }; // Default to 'NR' if no certification is found
  };

  const displayItems = (items) => {
    moviesList.innerHTML = '';
    items.forEach(item => {
      const releaseDate = formatDate(item.release_date);
      const title = item.title;
      const posterPath = item.poster_path ? `${imageBaseUrl}${item.poster_path}` : 'placeholder-image-url';
      const runtime = formatRuntime(item.runtime);
      const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
      const certification = item.certification.rating;
      const certificationHint = item.certification.hint;

      const cardHTML = `
        <li>
          <div class="movie-card" data-id="${item.id}">
            <figure class="card-banner">
              <img src="${posterPath}" alt="${title}">
            </figure>
            <div class="title-wrapper">
              <h3 class="card-title">${title}</h3>
              <time datetime="${releaseDate}">${releaseDate}</time>
            </div>
            <div class="card-meta">
              <div class="badge badge-outline" title="${certificationHint}">${certification}</div>
              <div class="duration">
                <ion-icon name="time-outline"></ion-icon>
                <time>${runtime}</time>
              </div>
              <div class="rating">
                <ion-icon name="star"></ion-icon>
                <data>${rating}</data>
              </div>
            </div>
          </div>
        </li>
      `;
      moviesList.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Add event listeners to movie cards
    const movieCards = document.querySelectorAll('.movie-card');
    movieCards.forEach(card => {
      card.addEventListener('click', () => {
        const movieId = card.getAttribute('data-id');
        window.location.href = `./movie-details.html?id=${movieId}`;
      });
    });
  };
  


  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A mins';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Load upcoming movies by default
  fetchUpcoming(upcomingMoviesUrl);
});
