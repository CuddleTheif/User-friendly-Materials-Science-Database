(function() {
	
	// Limit sample count
	var maxSamples = 500;

	// Import the needed library
	const request = require('request');

	// URLs for the htem api
	var htemBaseURL = "https://htem-api.nrel.gov",
		sampleLibraries = "/api/sample_library/complete",
		sampleLibraryInfo = "/api/sample_library/",
		sampleInfo = "/api/sample/";
	
	
	// Gets all the samples from the htem database
	function getLibraries(callback, progress, subprogress){
		
		// First get the libraries
		request({
		    url: htemBaseURL+sampleLibraries,
		    method: "GET"
		}, function (error, response, body){
			
			// Check for error
			if(error){
				callback(error);
				return;
			}
			
			// Get the libraries
		    var libraries = JSON.parse(body);
		    
			// Create variables for getting all samples of each library
			var libCount = 0;
			var getLibSamples = function(error, libraryInfo, samples){
				
				// Check for error
				if(error){
					callback(error);
					return;
				}
				
				// Store the current library's info
				if(libraryInfo)
					libraries[libCount] = libraryInfo;
				
				// Store the current library samples
				if(samples)
					libraries[libCount].samples = samples;
				
				// Check if more libraries to load
				if(++libCount>= (maxSamples ? maxSamples : libraries.length))
					callback(null, (maxSamples ? libraries.slice(0, maxSamples) : libraries));
				else{
					if(progress)
						progress(libCount+1, libraries.length, "Loading Library ");//500, "Loading Library ");
					getLibrarySamples(libraries[libCount].id, getLibSamples, subprogress);
				}
			};
			
			// Then get all the samples for each library
			getLibrarySamples(libraries[0].id, getLibSamples, subprogress);
			
		});
		
	}
	
	// Get all the samples of the given library
	function getLibrarySamples(libraryId, callback, progress){
		request({
    		url: htemBaseURL+sampleLibraryInfo+libraryId,
    		method: "GET"
    	}, function (error, response, body){

			// Check for error
			if(error){
				callback(error);
				return;
			}
			
			// Get the library info
		    var library = JSON.parse(body);
		    
		    // Remove null elements in arrays
		    for(var key in library)
		    	if(library.hasOwnProperty(key))
		    		while(library[key] && library[key].length > 0 && library[key].indexOf(null)!=-1)
		    			library[key].splice(library[key].indexOf(null), 1);

			// Make sure there are samples
			if(library.sample_ids==null || library.sample_ids.length<=0){
				callback(null, library, []);
				return;
			}
			
			// Create variables for check when all sample info has been gotten
			var sampleCount = 0;
			var samples = [];
			var checkSampleCount = function(){
				if(++sampleCount>=library.sample_ids.length)
					callback(null, library, samples);
				else if(progress)
					progress(sampleCount+1, library.sample_ids.length, "Loading Sample ");
			};
			
			// Get the samples info for this library
			for(var sampleId in library.sample_ids){
				(function(i){
					
					var tryAgain = 0;
					var checkSample = function(error, sample){
						if(error){
							if(tryAgain++<10){
								getSampleInfo(library.sample_ids[i], checkSample);
							}
							else{
								callback(error);
								return;
							}
						}
						else{
							samples.push(sample);
							checkSampleCount();
						}
					}
					getSampleInfo(library.sample_ids[i], checkSample);
					
				})(sampleId);
			}
    	});
	}
	
	function getSampleInfo(sampleId, callback){
		request({
			url: htemBaseURL+sampleInfo+sampleId,
			method: "GET"
		}, function (error, response, body){
			
			// Check for error
			if(error){
				callback(error);
				return;
			}

			// Get the sample info
			try{
			    var sample = JSON.parse(body);
			    // Remove null elements in arrays
			    for(var key in sample)
			    	if(sample.hasOwnProperty(key))
			    		while(sample[key] && sample[key].length > 0 && sample[key].indexOf(null)!=-1)
			    			sample[key].splice(sample[key].indexOf(null), 1);
			    callback(null, sample);
			}
			catch(err){
				callback(err);
			}
			
		});
	}
	
	function updateDatabase(database, callback, progress, subprogress, subsubprogress){
		
		// First get all the samples
		getLibraries((error, libraries) => {

			// Check for error
			if(error){
				callback(error);
				return;
			}
			
			// Create counter for counting libraries removed
			var libRemoved = 0;
			
			// Remove each library
			database.transaction((trx)=>{
				
				if(subprogress)
					subprogress();
				var removeLibrary = (l) => {
					if(progress)
						progress(l, libraries.length, "Deleting Library ");
					return database('libraries').where('library_id', libraries[l].id).del().transacting(trx);
				};
				var removeQuery = removeLibrary(0);
				for(var l=1;l<libraries.length;l++){
					((l) => {
						removeQuery.then(() =>{return removeLibrary(l);});
					})(l);
				}
				removeQuery.then(trx.commit);
				
			}).then(() =>{
				
				// Add each library
				database.transaction((trx)=>{
					
					var addLibrary = (l) =>{
						
						if(progress)
							progress(l, libraries.length, "Adding Library ");
						return database('libraries').insert({
							library_id: parseFloat(libraries[l].id) || null,
							sample_time_min: parseFloat(libraries[l].deposition_sample_time_min) || null,
							base_pressure_mtorr: parseFloat(libraries[l].deposition_base_pressure_mtorr) || null,
							growth_pressure_mtorr: parseFloat(libraries[l].deposition_growth_pressure_mtorr) || null,
							//target_pulses: libraries[l].deposition_target_pulses,
							rep_rate: parseFloat(libraries[l].deposition_rep_rate) || null,
							energy: parseFloat(libraries[l].deposition_energy) || null,
							cycles: parseFloat(libraries[l].deposition_cycles) || null,
							ts_distance: parseFloat(libraries[l].deposition_ts_distance) || null,
							initial_temp_c: parseFloat(libraries[l].deposition_initial_temp_c) || null,
							substrate_material: libraries[l].deposition_substrate_material,
							owner: 1
						}).transacting(trx);
					};
					var libCounter = 0;
					for(var l in libraries){
						((l) => {
							addLibrary(l).then((promise) => {
								if(++libCounter>=libraries.length)
									trx.commit(promise);
							});
						})(l);
					}
					
					
				}).then(() => {
					
					// Add each sample and library extra info
					database.transaction((trx) =>{
						
						// Variables for tracking progress
						var totalParts = 0;
						var partsDone = 0;
						var checkPartsDone = (promise) => {
							console.log(partsDone+":"+totalParts);
							if(progress)
								progress(partsDone, totalParts, "Adding Library Part ");
							if(++partsDone>=totalParts)
								trx.commit(promise);
						};
						
						for(var l in libraries){
							((l) => {
								
								// Add the deposition compounds
								if(libraries[l].deposition_compounds){
									var addCompound = (l, compound_id) => {
										totalParts++;
										return database('deposition_compounds').insert({
											library_id: parseFloat(libraries[l].id) || null,
											deposition_compound_id: compound_id, 
											compound_name: libraries[l].deposition_compounds[compound_id],
											power: parseFloat(libraries[l].deposition_power[compound_id]) || null
										}).transacting(trx).then(checkPartsDone);
									};
									for(var compound_id in libraries[l].deposition_compounds){
										((compound_id) => {
											addCompound(l, compound_id);
										})(compound_id);
									}
								}

								
								// Add the deposition gases
								if( libraries[l].deposition_gas_flow_sccm){
									var addGas = (l, gas_id) => {
										totalParts++;
										return database('gasses').insert({
											library_id: parseFloat(libraries[l].id) || null,
											gas_id: gas_id, 
											gas_name: libraries[l].deposition_gases[gas_id],
											gas_flow_scm: parseFloat(libraries[l].deposition_gas_flow_sccm[gas_id]) || null
										}).transacting(trx).then(checkPartsDone);
									};
									for(var gas_id in libraries[l].deposition_gas_flow_sccm){
										((gas_id) => {
											addGas(l, gas_id);
										})(gas_id);
									}
								}
								
								
								// Add all the samples for this library
								if(libraries[l].samples){
									var addSample = (l, s) => {
										totalParts++;
										var curSample = libraries[l].samples[s];
										return database('samples').insert({
											sample_id: parseFloat(curSample.id) || null,
											library_id: parseFloat(libraries[l].id) || null,
											thickness: parseFloat(curSample.thickness) || null,
											resistivity: parseFloat(curSample.fpm_resistivity) || null,
											conductivity: parseFloat(curSample.fpm_conductivity) || null,
											standard_deviation: parseFloat(curSample.fpm_standard_deviation) || null,
											sheet_resistance: parseFloat(curSample.fpm_sheet_resistance) || null,
											peak_count: parseFloat(curSample.peak_count) || null,
											opt_direct_bandgap_ev: parseFloat(curSample.opt_direct_bandgap_ev) || null,
											opt_average_vis_trans: parseFloat(curSample.opt_average_vis_trans) || null
										}).transacting(trx).then(checkPartsDone);
									};
									for(var s in libraries[l].samples){
										((s) => {
											addSample(l, s);
										})(s);
									}
								}
								
							})(l);
						}
						
					}).then(() => {
						
						// Add each sample extra info
						database.transaction((trx) =>{
							

							// Variables for tracking progress
							var totalParts = 0;
							var partsDone = 0;
							var checkPartsDone = (promise) => {
								console.log(partsDone+":"+totalParts);
								if(progress)
									progress(partsDone, totalParts, "Adding Sample Part ");
								if(++partsDone>=totalParts)
									trx.commit(promise);
							};
							
							for(var l in libraries){
								for(var s in libraries[l].samples){
									((l, s) => {
										
										// Add the compound for the current sample
										if(libraries[l].samples[s].xrf_compounds){
											var addCompound = (l, s, compound_id) => {
												totalParts++;
												var curSample = libraries[l].samples[s];
												return database('compounds').insert({
													sample_id: parseFloat(curSample.id) || null,
													compound_id: compound_id, 
													compound_name: curSample.xrf_compounds[compound_id],
													concentration: parseFloat(curSample.xrf_concentration[compound_id]) || 0
												}).transacting(trx).then(checkPartsDone);
											};
											for(var compound_id in libraries[l].samples[s].xrf_compounds){
												((l, s, compound_id) => {
													addCompound(l, s, compound_id);
												})(l, s, compound_id);
											}
										}
										
										// Add the sample's elements
										if(libraries[l].samples[s].xrf_elements){
											for(var element_id in libraries[l].samples[s].xrf_elements){
												((l, s, element_id) => {

													totalParts++;
													var curSample = libraries[l].samples[s];
													database('elements').insert({
														sample_id: parseFloat(curSample.id) || null,
														element_id: element_id, 
														element_name: curSample.xrf_elements[element_id]
													}).transacting(trx).then(checkPartsDone);
													
												})(l, s, element_id);
											}
										}
										
										// Add the sample's fpm results
										if(libraries[l].samples[s].fpm_voltage_volts){
											for(var fpm_id in libraries[l].samples[s].fpm_voltage_volts){
												((l, s, fpm_id) => {

													totalParts++;
													var curSample = libraries[l].samples[s];
													database('fpm').insert({
														sample_id: parseFloat(curSample.id) || null,
														fpm_id: fpm_id, 
														voltage: parseFloat(curSample.fpm_voltage_volts[fpm_id]) || null,
														current_amps: parseFloat(curSample.fpm_current_amps[fpm_id]) || null
													}).transacting(trx).then(checkPartsDone);
													
												})(l, s, fpm_id);
											}
										}
										
									})(l, s);
								}
							}
							
						}).then(() => {callback();}).catch((error) => {callback(error);});
					}).catch((error) => {callback(error);});
				}).catch((error) => {callback(error);});
			}).catch((error) => {callback(error);});
				
		}, progress, subprogress);
		
	}
	
	module.exports.test = updateDatabase;
})();
