var dateArray = []; //array of date objects used
var selectedDate = document.getElementById('inputDate'); //variable created is from the HTML document
var dateLabel = document.getElementById('selectedDate'); ////variable created is from the HTML document
var casesFromFIPS = d3.map(); //creating overlayed map that will place COVID-19 cases on map. FIPS is the location code for the county

var mapColor //variable for map fill color
var geoPath = d3.geoPath(); //creating path form the geoPath D3 method, which is for map projections


var svgMapOfUS = d3.select("#mapOfUS"); //D3 selecting the SVG map, found in the HTML index
var mapHeight = svgMapOfUS.attr("height"); //setting map height attribute
var mapWidth = svgMapOfUS.attr("width"); //setting map width attribuet

  //the following variable, viewMap, provides the dimensions of the map.
  //the g element is the grouping of SVG shapes together.
var viewMap = svgMapOfUS.attr("viewBox", [0, 0, mapWidth, mapHeight]).append("g");

// the below is the Johns Hopkins data set used throughout this Project
var covidDataSet = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv";


d3.csv(covidDataSet).then(covidCase => { //using csv method as that is how the data set is presented.

  //the returnFIPSValue() function returns the FIPS, or county location code.
  //It also reformats to a usable format, such as if there is a period needing to be removed.

  function returnFIPSValue(fipsVal) {
      if(fipsVal.includes(".")) {
          fipsVal = fipsVal.split(".")[0];
      }

      if(fipsVal.length === 4) { //there were some instances where the length of the FIPS code was 4, but 5 digit was needed
          fipsVal = "0" + fipsVal;
      }
      return fipsVal;
  }

  //the following for loop enabled creation of the dateArray using the covidDataSet
  //without it, there would be undefined dates
    for( let i = 11; i < covidCase.columns.length; i++) { //the 11th i value is the first usable date for this map.
        dateArray.push(covidCase.columns[i]);
    }

    //the following line of code found the max, or last, date array value
    selectedDate.max = (dateArray.length - 1);
    //the following line of code states that 'selectedDate' waits on input (when date is selected with slider)
    selectedDate.oninput();

    var largestCaseValue = 0;

    //the following line of code filters the covid case based on whether or not the Admin2 FIPS value
    //is empty.
    covidCase = covidCase.filter(countyVal => countyVal.Admin2 !== "");
    covidCase.forEach(countyVal => {  //proceeding to do this for every county element in the dateArray

        var casesFromDate = d3.map(); //d3 mapping the matches the date to the cases
        dateArray.forEach(dateVal => { //proceeding to do this for every date element in the dateArray

        var countyCase = countyVal[dateVal]; //setting the countyCase amount to the value of the countyVal
                                             //array at the dateVal index

    //the following if/else function determines the largestCaseValue through comparison of the
    //largestCaseValue with the current  countyCase. if the countyCase is larger, the largestCaseValue
    //takes on the value of countyCase

        if(parseInt(countyCase) > largestCaseValue) {
          largestCaseValue = countyCase;
        }

        else {
          largestCaseValue = largestCaseValue;
        }

        casesFromDate.set(dateVal, countyCase); //setting the date and case ammount to casesFromDate

        });

        casesFromFIPS.set(returnFIPSValue(countyVal.FIPS), casesFromDate); //using the previous casesFromDate
        //(continued from previous line) as a paramter with the returned FIPS value to form the set casesFromFIPS
    });


    d3.json("https://d3js.org/us-10m.v1.json").then(USAMap => { //using d3 library to create map of USA

      //using the tooltip attribute to create a countyCaseCounter popup for the user to see how many casesFromDate
      //there are at a given time.
      var countyCaseCounter = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0.7);

      //the following line is using the scale property to form a heat map with a rainbow interpolation,purple
      //being 0 cases, and red being for the county with the highest count.

      mapColor = d3.scaleSequentialSymlog(d3.interpolateRainbow).domain([0, largestCaseValue]); //Symlog used to better portray the spread of the virus
      //the following blocks of code are used to create the map of the USA, which is then presented to the user. It was adapted from a tutorial on D3 visualizations

      viewMap.append("path") //creating outline for the United States country as a whole. Nothing is filled in, as that is taken care of by the counties' fill (below)
          .datum(topojson.mesh(USAMap, USAMap.objects.nation))
          .attr("class", "america").attr("d", geoPath); //the 'd' is an SVG attribute used to draw paths

          viewMap.append("path") //creating outline for each individual state. Nothing is filled in, as that is taken care of by the counties' fill (below)
            .datum(topojson.mesh(USAMap, USAMap.objects.states, (a, b) => a !== b))
            .attr("class", "state").attr("d", geoPath); //the 'd' element is an SVG attribute used to draw paths.


      viewMap.append("g").attr("class", "county").selectAll("path") //developing the county map, using g element to group all counties together.
            .data(topojson.feature(USAMap, USAMap.objects.counties).features) //using the topoJSON library to create topographical map of the USA with counties
            .join("path").attr("d", geoPath) //data join to add in the path elements
            .on("mouseover", d => { //determining what will happen during the mouse hover. The number of cases will be deterined and then presented to the user
                countyCaseCounter.html(casesFromFIPS.get(d.id).get(dateArray[selectedDate.value]) + ' cases of the novel coronavirus in this county');
                countyCaseCounter.style("opacity", 0.7);
            })
            .attr("fill", d => mapColor(casesFromFIPS.get(d.id).get(dateArray[selectedDate.value]))) //filling in the county with corresponding mapColor. The 'd' element defines path drawn.
    });
});

//finally, the refreshDate() function is used to change the value of all of the counties case count based on the selected date from the input (function referred to in HTML document)
function refreshDate(selection) {

        dateLabel.innerHTML = dateArray[selection];
        viewMap.select(".county").selectAll("path")
            .attr("fill", d => mapColor(casesFromFIPS.get(d.id).get(dateArray[selectedDate.value]))); //re-fills in the county based on the new date value
    }
