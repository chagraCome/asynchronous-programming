// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  try {
    getTracks().then((tracks) => {
      const html = renderTrackCards(tracks);
      renderAt("#tracks", html);
    });

    getRacers().then((racers) => {
      const html = renderRacerCars(racers);
      renderAt("#racers", html);
    });
  } catch (error) {
    console.log("Problem getting tracks and racers ::", error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    "click",
    function (event) {
      const { target } = event;

      // Race track form field
      if (target.matches(".card.track")) {
        handleSelectTrack(target);
      }

      // Podracer form field
      if (target.matches(".card.podracer")) {
        handleSelectPodRacer(target);
      }

      // Submit create race form
      if (target.matches("#submit-create-race")) {
        event.preventDefault();

        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches("#gas-peddle")) {
        handleAccelerate(target);
      }
    },
    false
  );
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  // render starting UI
  const playerId = parseInt(store.player_id);
  const trackId = parseInt(store.player_id);
  if (!playerId || !trackId) {
    alert("Please select both racer and track!");
    return;
  }
  try {
    const race = await createRace(playerId, trackId);
    renderAt("#race", renderRaceStartView(race.Track, race.playerId));
    store.race_id = parseInt(race.ID) - 1;
    // The race has been created, now start the countdown
    await runCountdown();
    await startRace(store.race_id);
    await runRace(store.race_id);
  } catch (error) {
    console.log("Error with handleCreateRace:: ", error);
  }
}

function runRace(raceID) {
  return new Promise((resolve) => {
    const intervel = setInterval(async () => {
      try {
        const race = await getRace(raceID);
        console.log("race.status: ", race.status);
        if (race.status === "in-progress") {
          renderAt("#leaderBoard", raceProgress(race.positions));
        } else if (race.status === "finished") {
          clearInterval(intervel);
          renderAt("#race", resultsView(race.positions));
		      resolve(race);
        }
      } catch (error) {
        console.log("problem in raceInterval runRace: ", error);
      }
    }, 500);
  });
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;

    return new Promise((resolve) => {
      const countIntervalDown = setInterval(() => {
        // run this DOM manipulation to decrement the countdown for the user
        if (timer != 0) {
          document.getElementById("big-numbers").innerHTML = --timer;
        } else {
          clearInterval(countIntervalDown);
          resolve();
        }
      }, 1000);
    });
  } catch (error) {
    console.log("problem in runCountdown function", error);
  }
}

function handleSelectPodRacer(target) {
  console.log("selected a pod", target.id);

  // remove class selected from all racer options
  const selected = document.querySelector("#racers .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // add class selected to current target
  target.classList.add("selected");
  //save the selected racer to the store
  store.player_id = parseInt(target.id);
}

function handleSelectTrack(target) {
  console.log("selected a track", target.id);

  // remove class selected from all track options
  const selected = document.querySelector("#tracks .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // add class selected to current target
  target.classList.add("selected");

  // save the selected track id to the store
  store.track_id = parseInt(target.id);
}

function handleAccelerate() {
  // Invoke the API call to accelerate
   accelerate(store.race_id)
  .then(()=>console.log("accelerate button clicked"))
  .catch((err) => console.log("problem with handleAccelerate",err))
}

// HTML VIEWS ------------------------------------------------

function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join("");

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }

  const results = tracks.map(renderTrackCard).join("");

  return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
  return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
  const userPlayer = positions.find((e) => e.id === parseInt(store.player_id));
  userPlayer.driver_name += " (you)";

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions.map((p) => {
    return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name} </h3>
				</td>
			</tr>
		`;
  });

  return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);

  node.innerHTML = html;
}

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
  return {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": SERVER,
    },
  };
}



function getTracks() {
  return fetch(`${SERVER}/api/tracks`)
    .then((res) => res.json())
    .catch((err) => console.log(err));
}

function getRacers() {
  return fetch(`${SERVER}/api/cars`)
    .then((response) => response.json())
    .catch((error) => {
      console.log(error);
    });
}

function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  return fetch(`${SERVER}/api/races`, {
    method: "POST",
    ...defaultFetchOpts(),
    dataType: "jsonp",
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.log("Problem with createRace request:", err));
}

function getRace(id) {
  return fetch(`${SERVER}/api/races/${id}`)
    .then((res) => res.json())
    .catch((err) => console.log(err));
}

function startRace(id) {
  return (
    fetch(`${SERVER}/api/races/${id}/start`, {
      method: "POST",
      ...defaultFetchOpts(),
    })
      .catch((err) => console.log("Problem with getRace request::", err))
  );
}

function accelerate(id) {
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: "POST",
    ...defaultFetchOpts(),
  }).catch((err) => console.log("Problem with accelerate request::", err));
}
