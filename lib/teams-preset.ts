// 2024 NCAA Tournament field — use as admin preset
export interface TeamPreset {
  name: string;
  short_name: string;
  seed: number;
  region: string;
  color: string;
}

export const TEAMS_2024: TeamPreset[] = [
  // East
  { name: 'UConn Huskies',          short_name: 'UCONN',  seed: 1,  region: 'East',    color: '#002868' },
  { name: 'Iowa State Cyclones',     short_name: 'ISU',    seed: 2,  region: 'East',    color: '#C8102E' },
  { name: 'Illinois Fighting Illini',short_name: 'ILL',    seed: 3,  region: 'East',    color: '#E84A27' },
  { name: 'Auburn Tigers',           short_name: 'AUB',    seed: 4,  region: 'East',    color: '#0C2340' },
  { name: 'San Diego State Aztecs',  short_name: 'SDSU',   seed: 5,  region: 'East',    color: '#A6192E' },
  { name: 'BYU Cougars',             short_name: 'BYU',    seed: 6,  region: 'East',    color: '#002E5D' },
  { name: 'Washington State Cougars',short_name: 'WSU',    seed: 7,  region: 'East',    color: '#981E32' },
  { name: 'Florida Atlantic Owls',   short_name: 'FAU',    seed: 8,  region: 'East',    color: '#CC0000' },
  { name: 'Northwestern Wildcats',   short_name: 'NW',     seed: 9,  region: 'East',    color: '#4E2683' },
  { name: 'Drake Bulldogs',          short_name: 'DRAKE',  seed: 10, region: 'East',    color: '#004B8D' },
  { name: 'Duquesne Dukes',          short_name: 'DUQ',    seed: 11, region: 'East',    color: '#003087' },
  { name: 'UAB Blazers',             short_name: 'UAB',    seed: 12, region: 'East',    color: '#1E6B52' },
  { name: 'Yale Bulldogs',           short_name: 'YALE',   seed: 13, region: 'East',    color: '#00356B' },
  { name: 'Morehead State Eagles',   short_name: 'MORE',   seed: 14, region: 'East',    color: '#003087' },
  { name: 'South Dakota State Jackrabbits', short_name: 'SDST', seed: 15, region: 'East', color: '#0033A0' },
  { name: 'Stetson Hatters',         short_name: 'STET',   seed: 16, region: 'East',    color: '#006747' },
  // West
  { name: 'North Carolina Tar Heels',short_name: 'UNC',    seed: 1,  region: 'West',    color: '#56A0D3' },
  { name: 'Arizona Wildcats',        short_name: 'ARIZ',   seed: 2,  region: 'West',    color: '#003366' },
  { name: 'Baylor Bears',            short_name: 'BAY',    seed: 3,  region: 'West',    color: '#154734' },
  { name: 'Alabama Crimson Tide',    short_name: 'ALA',    seed: 4,  region: 'West',    color: '#9E1B32' },
  { name: "Saint Mary's Gaels",      short_name: 'SMC',    seed: 5,  region: 'West',    color: '#162B55' },
  { name: 'Clemson Tigers',          short_name: 'CLEM',   seed: 6,  region: 'West',    color: '#F66733' },
  { name: 'Dayton Flyers',           short_name: 'DAY',    seed: 7,  region: 'West',    color: '#CE1141' },
  { name: 'Mississippi State Bulldogs', short_name: 'MSST', seed: 8, region: 'West',   color: '#660000' },
  { name: 'Michigan State Spartans', short_name: 'MSU',    seed: 9,  region: 'West',    color: '#18453B' },
  { name: 'Nevada Wolf Pack',        short_name: 'NEV',    seed: 10, region: 'West',    color: '#003366' },
  { name: 'New Mexico Lobos',        short_name: 'UNM',    seed: 11, region: 'West',    color: '#BA0C2F' },
  { name: 'Grand Canyon Antelopes',  short_name: 'GCU',    seed: 12, region: 'West',    color: '#522398' },
  { name: 'Charleston Cougars',      short_name: 'COFC',   seed: 13, region: 'West',    color: '#4A0072' },
  { name: 'Colgate Raiders',         short_name: 'COLG',   seed: 14, region: 'West',    color: '#821019' },
  { name: 'Long Beach State Beach',  short_name: 'LBSU',   seed: 15, region: 'West',    color: '#000000' },
  { name: 'Wagner Seahawks',         short_name: 'WAG',    seed: 16, region: 'West',    color: '#006338' },
  // South
  { name: 'Houston Cougars',         short_name: 'HOU',    seed: 1,  region: 'South',   color: '#C8102E' },
  { name: 'Marquette Golden Eagles', short_name: 'MARQ',   seed: 2,  region: 'South',   color: '#003087' },
  { name: 'Kentucky Wildcats',       short_name: 'UK',     seed: 3,  region: 'South',   color: '#0033A0' },
  { name: 'Duke Blue Devils',        short_name: 'DUKE',   seed: 4,  region: 'South',   color: '#003087' },
  { name: 'Wisconsin Badgers',       short_name: 'WIS',    seed: 5,  region: 'South',   color: '#C5050C' },
  { name: 'Texas Tech Red Raiders',  short_name: 'TTU',    seed: 6,  region: 'South',   color: '#CC0000' },
  { name: 'Florida Gators',          short_name: 'FLA',    seed: 7,  region: 'South',   color: '#0021A5' },
  { name: 'Nebraska Cornhuskers',    short_name: 'NEB',    seed: 8,  region: 'South',   color: '#E41C38' },
  { name: 'Texas A&M Aggies',        short_name: 'TAMU',   seed: 9,  region: 'South',   color: '#500000' },
  { name: 'Colorado Buffaloes',      short_name: 'COLO',   seed: 10, region: 'South',   color: '#CFB87C' },
  { name: 'NC State Wolfpack',       short_name: 'NCST',   seed: 11, region: 'South',   color: '#CC0000' },
  { name: 'James Madison Dukes',     short_name: 'JMU',    seed: 12, region: 'South',   color: '#450084' },
  { name: 'Vermont Catamounts',      short_name: 'VER',    seed: 13, region: 'South',   color: '#154734' },
  { name: 'Akron Zips',              short_name: 'AKR',    seed: 14, region: 'South',   color: '#041E42' },
  { name: 'Samford Bulldogs',        short_name: 'SAM',    seed: 15, region: 'South',   color: '#003087' },
  { name: 'Longwood Lancers',        short_name: 'LWD',    seed: 16, region: 'South',   color: '#003087' },
  // Midwest
  { name: 'Purdue Boilermakers',     short_name: 'PUR',    seed: 1,  region: 'Midwest', color: '#CEB888' },
  { name: 'Tennessee Volunteers',    short_name: 'TENN',   seed: 2,  region: 'Midwest', color: '#FF8200' },
  { name: 'Creighton Bluejays',      short_name: 'CREI',   seed: 3,  region: 'Midwest', color: '#005CA9' },
  { name: 'Kansas Jayhawks',         short_name: 'KU',     seed: 4,  region: 'Midwest', color: '#0051BA' },
  { name: 'Gonzaga Bulldogs',        short_name: 'GONZ',   seed: 5,  region: 'Midwest', color: '#041E42' },
  { name: 'South Carolina Gamecocks',short_name: 'SC',     seed: 6,  region: 'Midwest', color: '#73000A' },
  { name: 'Texas Longhorns',         short_name: 'TEX',    seed: 7,  region: 'Midwest', color: '#BF5700' },
  { name: 'Utah State Aggies',       short_name: 'USU',    seed: 8,  region: 'Midwest', color: '#0F2439' },
  { name: 'TCU Horned Frogs',        short_name: 'TCU',    seed: 9,  region: 'Midwest', color: '#4D1979' },
  { name: 'Colorado State Rams',     short_name: 'CSU',    seed: 10, region: 'Midwest', color: '#1E4D2B' },
  { name: 'Oregon Ducks',            short_name: 'ORE',    seed: 11, region: 'Midwest', color: '#154733' },
  { name: 'McNeese Cowboys',         short_name: 'MCN',    seed: 12, region: 'Midwest', color: '#003087' },
  { name: 'Samford Bulldogs',        short_name: 'SAM2',   seed: 13, region: 'Midwest', color: '#003087' },
  { name: 'Oakland Golden Grizzlies',short_name: 'OAK',    seed: 14, region: 'Midwest', color: '#FFB81C' },
  { name: "Saint Peter's Peacocks",  short_name: 'STP',    seed: 15, region: 'Midwest', color: '#002D72' },
  { name: 'Grambling Tigers',        short_name: 'GRAM',   seed: 16, region: 'Midwest', color: '#000000' },
];
