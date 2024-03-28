import { Game, GameTeam, MemberStanding } from '$lib/types';
import axios from 'axios';
import cheerio from 'cheerio';
import { members } from '$lib/global-var';

let standings: MemberStanding[] = [];

const url = 'https://www.cbssports.com/nba/standings/';
// export const load = (async ({ fetch, params }) => {
// 	return { members: standings };
// }) satisfies Standings;

// function to reset standings
const resetStandings = () => {
	standings = [
		new MemberStanding('Marcel'),
		new MemberStanding('Nate'),
		new MemberStanding('Bob'),
		new MemberStanding('Tom'),
		new MemberStanding('Carter'),
		new MemberStanding('Matt')
	];
};

export const load = async () => {
	resetStandings();

	return axios.get(url).then((response) => {
		// Load HTML we fetched in the previous line
		const $ = cheerio.load(response.data);

		const listItems = $('tbody > tr');

		listItems.each((index, element) => {
			const teamFull = $(element).find('td').eq(1).text();
			// const teamFull = $(element).find('td').eq(0).text();
			const team = teamFull.split(' - ')[0];
			if (team) {
				const wins = $(element).find('td').eq(2).text().trim();
				const losses = $(element).find('td').eq(3).text().trim();
				const member = members.find((member) => member.teams.includes(team));
				const teamImg = $(element).find('td').eq(1).find('img').attr('data-lazy') || '';
				if (member) {
					const memberStanding = standings.find((standing) => standing.name === member.name);
					if (memberStanding) {
						memberStanding.wins += parseInt(wins);
						memberStanding.losses += parseInt(losses);
						memberStanding.teams.push({
							name: team,
							wins: parseInt(wins),
							losses: parseInt(losses),
							img: teamImg
						});
					}
				}
			}
		});

		// sort standings by wins, total games, team name
		standings.sort(
			(a, b) =>
				b.wins - a.wins || a.wins + a.losses - (b.wins + b.losses) || a.name.localeCompare(b.name)
		);

		// sort each member's teams by wins, name
		standings.forEach((member) => {
			member.teams.sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name));
		});

		// calculate games behind
		standings.forEach((member, index) => {
			if (index === 0) {
				member.gamesBehind = 0;
			} else {
				const leader = standings[0];
				member.gamesBehind = leader.wins - member.wins;
			}
		});

		return { members: standings };
	});
};
