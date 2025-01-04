// Traducciones de atributos y roles
const attributeTranslations = {
    str: "Fuerza",
    agi: "Agilidad",
    int: "Inteligencia",
    all: "Universal"
};

const roleTranslations = {
    "Carry": "Portador",
    "Escape": "Escape",
    "Nuker": "Nukero",
    "Initiator": "Iniciador",
    "Durable": "Durable",
    "Disabler": "Incapacitador",
    "Support": "Apoyo",
    "Pusher": "Empujador",
    "Jungler": "Jungla"
};

// Variables globales
let allHeroes = [];
let itemsData = null;
let loadingOverlay;

// Función para generar el HTML de los ítems
async function generateItemsHtml(itemsData) {
    if (!itemsData) return '';
    const categories = {
        start_game_items: 'Objetos Iniciales',
        early_game_items: 'Fase Temprana',
        mid_game_items: 'Fase Media',
        late_game_items: 'Fase Tardía'
    };
    let html = '<div class="items-container">';
    for (const [category, title] of Object.entries(categories)) {
        const items = itemsData[category];
        if (!items || Object.keys(items).length === 0) continue;
        html += `<div class="item-section"><h3>${title}</h3><div class="items-grid">`;
        const sortedItems = Object.entries(items).sort(([, a], [, b]) => b - a).slice(0, 6);
        for (const [itemId, count] of sortedItems) {
            const itemInfo = await getItemInfo(itemId);
            if (!itemInfo) continue;
            html += `
                <div class="item-card">
                    <img src="https://cdn.cloudflare.steamstatic.com${itemInfo.img}" alt="${itemInfo.dname}">
                    <div class="item-price">${itemInfo.cost || 0} oro</div>
                </div>
            `;
        }
        html += '</div></div>';
    }
    return html + '</div>';
}

// Función para obtener información de un ítem
async function getItemInfo(itemId) {
    if (!itemsData) {
        await fetchItemsData();
    }
    return Object.values(itemsData).find(item => item.id === parseInt(itemId));
}

// Función para obtener las partidas recientes de un héroe
async function fetchHeroMatches(heroId) {
    try {
        const response = await fetch(`https://api.opendota.com/api/heroes/${heroId}/matches`);
        const matches = await response.json();
        return matches;
    } catch (error) {
        console.error('Error fetching hero matches:', error);
        return [];
    }
}

// Función para mostrar el modal con detalles del héroe
async function showModal(hero) {
    showLoading('Cargando detalles del héroe...');
    try {
        const modal = document.getElementById('heroModal');
        const modalContent = document.getElementById('modalContent');

        if (!modal || !modalContent) {
            console.error('Modal o modalContent no encontrados en el DOM');
            return;
        }

        // Función para calcular el porcentaje de victorias
        const calculateWinRate = (picks, wins) => {
            if (picks === 0) return 0;
            return ((wins / picks) * 100).toFixed(2);
        };

        // Función para generar la barra de progreso
        const generateProgressBar = (percentage) => {
            return `
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%;"></div>
                    <span class="progress-text">${percentage}%</span>
                </div>
            `;
        };

        // Generar el HTML de las estadísticas del héroe
        const statsHtml = `
            <div class="hero-header">
                <img class="hero-img" src="https://cdn.cloudflare.steamstatic.com${hero.img}" alt="${hero.localized_name}">
                <div>
                    <h2>${hero.localized_name}</h2>
                    <p>Atributo Principal: ${attributeTranslations[hero.primary_attr] || "No definido"}</p>
                </div>
            </div>

            <div class="stats-grid">
                <table class="match-stats-table">
                    <thead>
                        <tr>
                            <th>Estadística</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Salud Base</td>
                            <td>${hero.base_health}</td>
                        </tr>
                        <tr>
                            <td>Regeneración de Salud</td>
                            <td>${hero.base_health_regen}</td>
                        </tr>
                        <tr>
                            <td>Maná Base</td>
                            <td>${hero.base_mana}</td>
                        </tr>
                        <tr>
                            <td>Regeneración de Maná</td>
                            <td>${hero.base_mana_regen}</td>
                        </tr>
                        <tr>
                            <td>Armadura Base</td>
                            <td>${hero.base_armor}</td>
                        </tr>
                        <tr>
                            <td>Resistencia Mágica</td>
                            <td>${hero.base_mr}%</td>
                        </tr>
                        <tr>
                            <td>Fuerza Base</td>
                            <td>${hero.base_str}</td>
                        </tr>
                        <tr>
                            <td>Agilidad Base</td>
                            <td>${hero.base_agi}</td>
                        </tr>
                        <tr>
                            <td>Inteligencia Base</td>
                            <td>${hero.base_int}</td>
                        </tr>
                        <tr>
                            <td>Ganancia de Fuerza</td>
                            <td>${hero.str_gain}</td>
                        </tr>
                        <tr>
                            <td>Ganancia de Agilidad</td>
                            <td>${hero.agi_gain}</td>
                        </tr>
                        <tr>
                            <td>Ganancia de Inteligencia</td>
                            <td>${hero.int_gain}</td>
                        </tr>
                        <tr>
                            <td>Daño de Ataque</td>
                            <td>${hero.base_attack_min} - ${hero.base_attack_max}</td>
                        </tr>
                        <tr>
                            <td>Rango de Ataque</td>
                            <td>${hero.attack_range}</td>
                        </tr>
                        <tr>
                            <td>Velocidad de Ataque</td>
                            <td>${hero.attack_rate}</td>
                        </tr>
                        <tr>
                            <td>Velocidad de Movimiento</td>
                            <td>${hero.move_speed}</td>
                        </tr>
                        <tr>
                            <td>Visión Diurna</td>
                            <td>${hero.day_vision}</td>
                        </tr>
                        <tr>
                            <td>Visión Nocturna</td>
                            <td>${hero.night_vision}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3>Estadísticas de Partidas</h3>
            <div class="table-container">
                <table class="match-stats-table">
                    <thead>
                        <tr>
                            <th>Tipo de Partida</th>
                            <th>Picks</th>
                            <th>Victorias</th>
                            <th>% Victorias</th>
                            <th>Baneos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Profesionales</td>
                            <td>${hero.pro_pick}</td>
                            <td>${hero.pro_win}</td>
                            <td>
                                ${generateProgressBar(calculateWinRate(hero.pro_pick, hero.pro_win))}
                            </td>
                            <td>${hero.pro_ban}</td>
                        </tr>
                        <tr>
                            <td>Públicos</td>
                            <td>${hero.pub_pick}</td>
                            <td>${hero.pub_win}</td>
                            <td>
                                ${generateProgressBar(calculateWinRate(hero.pub_pick, hero.pub_win))}
                            </td>
                            <td>N/A</td>
                        </tr>
                        <tr>
                            <td>Turbo</td>
                            <td>${hero.turbo_picks}</td>
                            <td>${hero.turbo_wins}</td>
                            <td>
                                ${generateProgressBar(calculateWinRate(hero.turbo_picks, hero.turbo_wins))}
                            </td>
                            <td>N/A</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        modalContent.innerHTML = statsHtml;

        // Cargar los ítems populares
        const itemsResponse = await fetch(`https://api.opendota.com/api/heroes/${hero.id}/itemPopularity`);
        const itemsData = await itemsResponse.json();
        const itemsHtml = await generateItemsHtml(itemsData);
        modalContent.innerHTML += itemsHtml;

        // Cargar los matchups del héroe
        const matchupsResponse = await fetch(`https://api.opendota.com/api/heroes/${hero.id}/matchups`);
        const matchupsData = await matchupsResponse.json();
        const matchupsHtml = generateMatchupsHtml(matchupsData);
        modalContent.innerHTML += matchupsHtml;

        // Cargar los jugadores pro que más han jugado con el héroe
        const playersResponse = await fetch(`https://api.opendota.com/api/heroes/${hero.id}/players`);
        const playersData = await playersResponse.json();
        const playersHtml = await generatePlayersHtml(playersData);
        modalContent.innerHTML += playersHtml;

        // Mostrar overlay de carga para partidas recientes
        showLoading('Cargando partidas...');

        // Obtener y mostrar las partidas recientes
        const matches = await fetchHeroMatches(hero.id);
        const recentMatchesHtml = `
            <h3>Partidas Pro</h3>
            <div class="table-container">
                <table class="match-stats-table">
                    <thead>
                        <tr>
                            <th>Match ID</th>
                            <th>Duración</th>
                            <th>Resultado</th>
                            <th>K/D/A</th>
                            <th>Liga</th>
                        </tr>
                    </thead>
                    <tbody id="recentMatchesBody">
                        ${matches.length > 0 ? matches.map(match => `
                            <tr>
                                <td>
                                    <button class="match-id" data-match-id="${match.match_id}">
                                        ${match.match_id}
                                    </button>
                                </td>
                                <td>${Math.floor(match.duration / 60)}:${match.duration % 60}</td>
                                <td>${match.radiant_win === (match.player_slot < 128) ? 'Victoria' : 'Derrota'}</td>
                                <td>${match.kills}/${match.deaths}/${match.assists}</td>
                                <td>${match.league_name || 'N/A'}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5">No hay partidas recientes disponibles.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
        modalContent.innerHTML += recentMatchesHtml;

        // Ocultar el overlay de carga
        hideLoading();

        // Agregar evento de clic a los botones de ID de partida
        const matchButtons = document.querySelectorAll('.match-id');
        matchButtons.forEach(button => {
            button.addEventListener('click', () => {
                const matchIdValue = button.getAttribute('data-match-id');
                openMatchModal(matchIdValue);
            });
        });

        // Agregar evento de clic a los enlaces de perfil de jugadores
        const playerLinks = document.querySelectorAll('.player-link');
        playerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const perfilUrl = link.getAttribute('href');
                openPlayerProfile(perfilUrl);
            });
        });

        // Mostrar el modal
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        if (modalContent) {
            modalContent.innerHTML = '<p>Error cargando datos del héroe</p>';
        }
    } finally {
        hideLoading();
    }
}

// Función para abrir el perfil de un jugador
function openPlayerProfile(perfilUrl) {
    const isAndroid = /android/i.test(navigator.userAgent);

    if (isAndroid) {
        // Construye el Intent para Android
        const intentUrl = `intent://${perfilUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;
    } else {
        // Si no es Android, abre la URL en una nueva pestaña
        window.open(perfilUrl, '_blank');
    }
}

// Función para abrir el modal de la partida
function openMatchModal(matchId) {
    const matchUrl = `https://www.opendota.com/matches/${matchId}`;
    const isAndroid = /android/i.test(navigator.userAgent);

    if (isAndroid) {
        // Construye el Intent para Android
        const intentUrl = `intent://${matchUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;
    } else {
        // Si no es Android, abre la URL en una nueva pestaña
        window.open(matchUrl, '_blank');
    }
}

// Función para generar el HTML de los matchups
function generateMatchupsHtml(matchupsData) {
    const sortedMatchups = matchupsData.sort((a, b) => b.wins - a.wins).slice(0, 10); // Top 10 matchups
    return `
        <h3>Matchups</h3>
        <div class="matchups-container">
            <div class="matchups-grid">
                ${sortedMatchups.map(matchup => `
                    <div class="matchup-card">
                        <img src="https://cdn.cloudflare.steamstatic.com${allHeroes.find(h => h.id === matchup.hero_id).img}" alt="${allHeroes.find(h => h.id === matchup.hero_id).localized_name}">
                        <span>${allHeroes.find(h => h.id === matchup.hero_id).localized_name}</span>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${((matchup.wins / matchup.games_played) * 100).toFixed(2)}%;"></div>
                            <span class="progress-text">${((matchup.wins / matchup.games_played) * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Función para generar el HTML de los jugadores pro
async function generatePlayersHtml(playersData) {
    const sortedPlayers = playersData.sort((a, b) => b.games_played - a.games_played).slice(0, 10); // Top 10 jugadores

    // Obtener detalles adicionales de cada jugador
    const playersWithDetails = await Promise.all(
        sortedPlayers.map(async (player) => {
            const playerDetails = await fetchPlayerDetails(player.account_id);
            return {
                ...player,
                name: playerDetails.profile?.personaname || 'Jugador Desconocido',
                avatar: playerDetails.profile?.avatarfull || 'https://via.placeholder.com/50',
                profileUrl: `https://www.opendota.com/players/${player.account_id}`,
            };
        })
    );

    return `
        <h3>Jugadores Pro</h3>
        <div class="players-container">
            <div class="players-grid">
                ${playersWithDetails.map(player => `
                    <div class="player-card">
                        <img src="${player.avatar}" alt="${player.name}">
                        <a href="${player.profileUrl}" target="_blank" class="player-link">${player.name}</a>
                        <span>Partidas: ${player.games_played}</span>
                        <span>Victorias: ${player.wins}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Función para obtener detalles de un jugador
async function fetchPlayerDetails(accountId) {
    try {
        const response = await fetch(`https://api.opendota.com/api/players/${accountId}`);
        const playerDetails = await response.json();
        return playerDetails;
    } catch (error) {
        console.error('Error fetching player details:', error);
        return { profile: {} };
    }
}

// Función para obtener y mostrar los héroes
async function fetchHeroes() {
    showLoading('Actualizando héroes...');
    try {
        const response = await fetch('https://api.opendota.com/api/heroStats');
        allHeroes = await response.json();
        document.getElementById('totalHeroes').textContent = allHeroes.length;
        await fetchItemsData();
        filterHeroes();
        updateLastUpdateDate();
    } catch (error) {
        console.error('Error:', error);
        const heroesContainer = document.getElementById('heroes');
        heroesContainer.innerHTML = `
            <div class="loading">
                <div class="loading-text">Error actualizando datos</div>
                <button class="more-info-btn" onclick="fetchHeroes()">Reintentar</button>
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Función para mostrar los héroes en la cuadrícula
function displayHeroes(heroes) {
    const heroesContainer = document.getElementById('heroes');
    document.getElementById('heroCount').textContent = `Mostrando ${heroes.length} héroes`;
    heroesContainer.innerHTML = heroes.map(hero => `
        <div class="hero-card">
            <div class="hero-header">
                <img class="hero-img" 
                     src="https://cdn.cloudflare.steamstatic.com${hero.img}" 
                     alt="${hero.localized_name}">
                <div>
                    <h2>${hero.localized_name}</h2>
                    <p>Atributo Principal: ${attributeTranslations[hero.primary_attr] || "No definido"}</p>
                </div>
            </div>
            
            <div class="roles">
                ${hero.roles.map(role => `
                    <span class="role">${roleTranslations[role] || role}</span>
                `).join('')}
            </div>

            <div class="stats-grid">
                <table class="match-stats-table">
                    <thead>
                        <tr>
                            <th>Estadística</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Salud Base</td>
                            <td>${hero.base_health}</td>
                        </tr>
                        <tr>
                            <td>Regeneración de Salud</td>
                            <td>${hero.base_health_regen}</td>
                        </tr>
                        <tr>
                            <td>Maná Base</td>
                            <td>${hero.base_mana}</td>
                        </tr>
                        <tr>
                            <td>Regeneración de Maná</td>
                            <td>${hero.base_mana_regen}</td>
                        </tr>
                        <tr>
                            <td>Armadura</td>
                            <td>${hero.base_armor}</td>
                        </tr>
                        <tr>
                            <td>Resistencia Mágica</td>
                            <td>${hero.base_mr}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <button class="more-info-btn" onclick="showModal(${JSON.stringify(hero).replace(/"/g, '&quot;')})">
                Ver más información
            </button>
        </div>
    `).join('');
}

// Función para obtener datos de los ítems
async function fetchItemsData() {
    try {
        if (!itemsData) {
            showLoading('Cargando datos de objetos...');
            const response = await fetch('https://api.opendota.com/api/constants/items');
            itemsData = await response.json();
        }
    } catch (error) {
        console.error('Error fetching items:', error);
    } finally {
        hideLoading();
    }
}

// Función para mostrar el overlay de carga
function showLoading(message = 'Cargando...') {
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
    }
    loadingOverlay.innerHTML = `
        <div class="loading">
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
            </svg>
            <div class="loading-text">${message}</div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
}

// Función para ocultar el overlay de carga
function hideLoading() {
    if (loadingOverlay && loadingOverlay.parentElement) {
        loadingOverlay.parentElement.removeChild(loadingOverlay);
    }
}

// Función para filtrar héroes
function filterHeroes() {
    const searchTerm = document.getElementById('searchHero').value.toLowerCase();
    const attributeFilter = document.getElementById('attributeFilter').value;
    const roleFilter = document.getElementById('roleFilter').value;
    const filteredHeroes = allHeroes.filter(hero => {
        const nameMatch = hero.localized_name.toLowerCase().includes(searchTerm);
        const attributeMatch = !attributeFilter || hero.primary_attr === attributeFilter;
        const roleMatch = !roleFilter || hero.roles.includes(roleFilter);
        return nameMatch && attributeMatch && roleMatch;
    });
    displayHeroes(filteredHeroes);
}

// Función para actualizar la fecha de última actualización
function updateLastUpdateDate() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdateDate').textContent = formattedDate;
}

// Event listeners
document.getElementById('attributeFilter').addEventListener('change', filterHeroes);
document.getElementById('roleFilter').addEventListener('change', filterHeroes);
document.getElementById('searchHero').addEventListener('input', filterHeroes);

window.onclick = function (event) {
    const modal = document.getElementById('heroModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// Iniciar la aplicación
document.addEventListener('DOMContentLoaded', fetchHeroes);