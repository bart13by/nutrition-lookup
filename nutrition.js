const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const fs = require('fs');
const yargs = require('yargs');
require('dotenv').config();

// Define command line arguments
const argv = yargs
  .option('outfile', {
    alias: 'o',
    description: 'Filename for CSV output. Adds --csv',
    type: 'string',
    demandOption: false
  })
  .option('item', {
    alias: 'i',
    description: 'A food item to look up. Multiple args are sent together to WS.',
    type: 'string',
    demandOption: true,
    array: true
  })
  
  .option('csv', {
    alias: 'c',
    description: 'Produce CSV output.',
    type: 'boolean',
    default: false
  })
  .option('console',{
  	description: 'Produce a report on the console even if CSV is selected.',
  	type: 'boolean',
	default: false
  })
  .option('noappend', {
  	alias: 'n',
  	description: 'Overwrite CSV file if it exists',
  	type: 'boolean',
  default: false
  })
  .option('echo', {
  	description: 'Echo CSV output to console.',
  	type: 'boolean',
	default: false
  })
  .option('total', {
  	alias: 't',
  	description: 'Include totals (in console mode)',
  	type: 'boolean',
	default: false
  })
  .option('totalonly', {
  	description: 'Only show totals (in console mode)',
  	type: 'boolean',
	default: false
  })
  .argv;



function getNutrients(food){
	const url = 'https://trackapi.nutritionix.com/v2/natural/nutrients';
	const headers = {
		'x-app-id': process.env.APP_ID,
		'x-app-key': process.env.APP_KEY,
	  'Content-Type': 'application/json'
	};
	
	const body = JSON.stringify({
	  query: food
	});

	fetch(url, {
	  method: 'POST',
	  headers: headers,
	  body: body
	})
	.then(response => {
	  if (!response.ok) {
	    throw new Error('Network response was not ok');
	  }
	  return response.json();
	})
	.then(jsonData => {
		if (argv.console || !argv.csv){
			console_output(jsonData);
		}
		if (argv.csv || argv.outfile){
			csv_output(jsonData);
		}
	})
	.catch(error => {
	  console.error('Error:', error);
	});

}
function console_output(jsonData){
	let totals = {
		cals: 0,
		macro_cals: 0,
		fat_cals: 0,
		carb_cals: 0,
		protein_cals: 0,
		fat: 0,
		sat: 0,
		prot: 0,
		fiber: 0,
		carb: 0,
		net_carb: 0
	};
	const show_total = (argv.total || argv.totalonly);
	let output = '';
	for (const result of jsonData['foods']){
		
		const protein_cals = (result['nf_protein'] * 4).toLocaleString('en-US', {maximumFractionDigits: 2});
		const fat_cals = (result['nf_total_fat'] * 9).toLocaleString('en-US', {maximumFractionDigits: 2});
		const carb_cals = (result['nf_total_carbohydrate'] * 4).toLocaleString('en-US', {maximumFractionDigits: 2});
		//Need to convert these back to floats in order to do math with them:
		const macro_cals = [protein_cals, fat_cals, carb_cals].reduce((total, num) => total + parseFloat(num), 0);

		const pct_cals_protein = (protein_cals/macro_cals)
				.toLocaleString('en-US', {
				  style: 'percent',
				  minimumFractionDigits: 2,
				  maximumFractionDigits: 2,
				});
		const pct_cals_carbs = (carb_cals/macro_cals)
				.toLocaleString('en-US', {
				  style: 'percent',
				  minimumFractionDigits: 2,
				  maximumFractionDigits: 2,
		});
		const pct_cals_fat = (fat_cals/macro_cals)
				.toLocaleString('en-US', {
				  style: 'percent',
				  minimumFractionDigits: 2,
				  maximumFractionDigits: 2,
		});
		if (show_total){
			totals['macro_cals'] += macro_cals;
			totals['fat_cals'] += parseFloat(fat_cals);
			totals['carb_cals'] += parseFloat(carb_cals);
			totals['protein_cals'] += parseFloat(protein_cals);
			totals['cals'] += result['nf_calories'];
			totals['fat'] += result['nf_total_fat'];
			totals['sat'] += result['nf_saturated_fat'];
			totals['prot'] += result['nf_protein'];
			totals['fiber'] += result['nf_dietary_fiber'];
			totals['carb'] += result['nf_total_carbohydrate'];
			totals['net_carb'] += result['nf_total_carbohydrate'] - result['nf_dietary_fiber'];
		}
		output +=  `
========  Item: ${result['food_name']}  ========
Serving: ${result['serving_weight_grams']} grams
Calories: ${result['nf_calories']} 
Fat cals: ${fat_cals} (${pct_cals_fat})
Carb cals: ${carb_cals} (${pct_cals_carbs})
Protein cals: ${protein_cals} (${pct_cals_protein})
Total fat: ${result['nf_total_fat']}g
Saturated fat: ${result['nf_saturated_fat']}g
Total Carbs: ${result['nf_total_carbohydrate']}g
Protein: ${result['nf_protein']}g
Fiber: ${result['nf_dietary_fiber']}g
Net Carbs: ${result['nf_total_carbohydrate'] - result['nf_dietary_fiber']}g\n`;

	}

	if (show_total){

		const total_pct_cals_protein = (totals['protein_cals']/totals['macro_cals']).toLocaleString('en-US', {
			  style: 'percent',
			  minimumFractionDigits: 2,
			  maximumFractionDigits: 2,
		});
		const total_pct_cals_fat = (totals['fat_cals']/totals['macro_cals']).toLocaleString('en-US', {
			  style: 'percent',
			  minimumFractionDigits: 2,
			  maximumFractionDigits: 2,
		});
		const total_pct_cals_carb = (totals['carb_cals']/totals['macro_cals']).toLocaleString('en-US', {
			  style: 'percent',
			  minimumFractionDigits: 2,
			  maximumFractionDigits: 2,
		});
		const formattedTotals = Object.fromEntries(
      Object.entries(totals).map(([key, value]) => [key, value.toLocaleString('en-US', { maximumFractionDigits: 2 })])
		);
		tot_out = `============ TOTALS ============
Calories: ${formattedTotals['cals'].toLocaleString('en-US', {maximumFractionDigits: 2 })}
Fat cals: ${formattedTotals['fat_cals']} (${total_pct_cals_fat}) 
Carb cals: ${formattedTotals['carb_cals']} (${total_pct_cals_carb})
Protein cals: ${formattedTotals['protein_cals']} (${total_pct_cals_protein})
Total fat: ${formattedTotals['fat']}g
Saturated fat: ${formattedTotals['sat']}g
Protein: ${formattedTotals['prot']}g
Fiber: ${formattedTotals['fiber']}g
Carbs: ${formattedTotals['carb']}g
Net carbs: ${formattedTotals['net_carb']}g\n`
	}
	if (!argv.totalonly){
		console.log(output);
	}
	if (show_total){
		console.log(tot_out);
	}

}
function csv_output(jsonData){
	const csv_headers = {
		path: argv.outfile ? argv.outfile : 'o',
	    header: [
	        {id: 'food', title: 'Food Item'},
	        {id: 'serving', title: "Serving (g)"},
	        {id: 'cals', title: 'Calories'},
	        {id: 'protein', title: 'Protein (g)'},
	        {id: 'fat', title: 'Total Fat (g)'},
	        {id: 'sat_fat', title: 'Saturated Fat (g)'},
	        {id: 'pct_cals_protein', title: 'PCT Calories from Protein'}
	    ],
	    append: !argv.noappend
	};
	const csvWriter = createCsvWriter(csv_headers);
	const csvStringifier = createCsvStringifier(csv_headers);
	const data = [];
	for (const result of jsonData['foods']){
		data.push({
			food: result['food_name'],
			serving: result['serving_weight_grams'],
			cals: result['nf_calories'],
			protein: result['nf_protein'],
			fat: result['nf_total_fat'],
			sat_fat: result['nf_saturated_fat'],
			pct_cals_protein: (result['nf_protein'] * 4/result['nf_calories']).toLocaleString('en-US', {
			  style: 'percent',
			  minimumFractionDigits: 2,
			  maximumFractionDigits: 2,
			})
		});
		
	}
	if (argv.echo){
		if (!argv.noappend){
			console.log(csvStringifier.getHeaderString());
		}
		console.log(csvStringifier.stringifyRecords(data));
	}
	if (argv.outfile){
		csvWriter.writeRecords(data)
	    .then(() => {
	        console.log('CSV file created successfully');
	    });	
	}
	
	
}
getNutrients(argv.item.join(';'));
