/*
Client 3 copy, tried to add running backs but got weird bug
also added the hover text element above the circle
also added no case sensitivity for checking names
*/

(function() {

    //chart variables
    var width = 300;
    var height = 150;
    var myChartFirst = linegraph();
    var myChartSecond = linegraph();
    var myChartThird = linegraph();
    var myChartFourth = linegraph();
    var fixScale = true;
    var perGame = false;

    //data variables
    var yearRange = [2014, 2015];
    //var playerName = "Peyton Manning";
    // var position = "qb";
    //var stats = [];

    //other
    //var fixScaleMaxScale = d3.scale.linear().domain([1, 16]).range([]) //for fixing x axis
    //var formatDate = d3.time.format("%d-%b-%y");
    var playerTags = [];


    //END GLOBAL VARIABLES


    addPlayerTags();

    $(document).ready(function() {
        //chartCall();

        $("#fixedscale").change(function() {
            fixScale = $("#fixedscale").is(':checked');
            chartCall();
        });

        $("#pergame").change(function() {
            perGame = $("#pergame").is(':checked');
            chartCall();
        });

        $("#playersearcharea").submit(function() {
            playerName = $("#playersearch").val().split(",")[0];
            console.log(playerName);
            chartCall();
            return false;
        });

        $("#playersearch").autocomplete({
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(playerTags, request.term);
                response(results.slice(0, 8));
            },
            select: function(event, ui) {
                $("#playersearch").val(ui.item.value.split(",")[0]);
                $("#playersearcharea").submit();
            }
        });

        $(function() {
            $("#yearslider").slider({
                min: 0,
                max: 1,
                range: true,
                orientation: "horizontal",
                values: [0, 1],
                change: function(event, ui) {
                    $("#minyear").html($(this).slider('values', 0));
                    $("#maxyear").html($(this).slider('values', 1));
                    yearRange = [$(this).slider('values', 0), $(this).slider('values', 1)];
                    if (event.originalEvent) {
                        chartCall(null, "yearchange");
                    }
                }
            });
        });
    });

    //END READY CALL

    function addPlayerTags() {
        var playerTagsFantasyPoints = [];
        var allLoaded = [false, false, false, false];
        d3.csv("nflquarterbacks19912015career.csv", function(error, d) {
            if (error) throw error;
            playerTagsFantasyPoints = addPlayerTagPosition(d, "QB", playerTagsFantasyPoints);
            allLoaded[0] = true;
        });

        d3.csv("nflrunningbacks19912015career.csv", function(error, d) {
            if (error) throw error;
            playerTagsFantasyPoints = addPlayerTagPosition(d, "RB", playerTagsFantasyPoints);
            allLoaded[1] = true;
        });

        d3.csv("nflwidereceivers19912015career.csv", function(error, d) {
            if (error) throw error;
            playerTagsFantasyPoints = addPlayerTagPosition(d, "WR", playerTagsFantasyPoints);
            allLoaded[2] = true;
        });

        d3.csv("nfltightends19912015career.csv", function(error, d) {
            if (error) throw error;
            playerTagsFantasyPoints = addPlayerTagPosition(d, "TE", playerTagsFantasyPoints);
            allLoaded[3] = true;
        });

        var loadInterval = setInterval(function() {
            if (allLoaded[0] == true && allLoaded[1] == true && allLoaded[2] == true && allLoaded[3] == true) {
                playerTagsFantasyPoints.sort(function(x, y) {            
                    return d3.descending(x.fantasyPoints, y.fantasyPoints);
                });

                for (var i = 0; i < playerTagsFantasyPoints.length; i++) {
                    playerTags.push(playerTagsFantasyPoints[i].playerName + ", " + playerTagsFantasyPoints[i].position);
                }
                clearInterval(loadInterval);
            }
        }, 1000);
    }

    function addPlayerTagPosition(d, position, playerTagsFantasyPoints) {
        for (var i = 0; i < d.length; i++) {
            var player = d[i];
            var years = 1;
            var fantasyPoints = 0;
            while (isFinite(+player["Year" + years + "Year"]) && +player["Year" + years + "Year"] > 0) {
                if (position == "QB") {
                    fantasyPoints += getQBFantasyPoints(player, years);
                } else if (position == "RB") {
                    fantasyPoints += getRBFantasyPoints(player, years);
                } else {
                    fantasyPoints += getWrTeFantasyPoints(player, years);
                }
                years++;
            }
            fantasyPoints = fantasyPoints / years;
            var playerTagObj = {playerName: player.PlayerName, fantasyPoints: fantasyPoints, position: position};
            playerTagsFantasyPoints.push(playerTagObj);
        }
        return playerTagsFantasyPoints;
    }


    //function that prepares all the updated data and calls the chart
    function chartCall(playerName, changeEvent) {
        if (!playerName) {
            playerName = $("#playersearch").val().split(",")[0];
        }

        d3.csv("nflquarterbacks19912015career.csv", function(error, d) {
            if (error) throw error;
            singlePlayerCall(d, "qb", playerName, changeEvent);
        });

        d3.csv("nflrunningbacks19912015career.csv", function(error, d) {
            if (error) throw error;
            singlePlayerCall(d, "rb", playerName, changeEvent);
        });

        d3.csv("nflwidereceivers19912015career.csv", function(error, d) {
            if (error) throw error;
            singlePlayerCall(d, "wr", playerName, changeEvent);
        });

        d3.csv("nfltightends19912015career.csv", function(error, d) {
            if (error) throw error;
            singlePlayerCall(d, "te", playerName, changeEvent);
        });
        
    }

    function singlePlayerCall(d, position, playerName, changeEvent) {
        var player = d.filter(function(row) {
            return row['PlayerName'].toLowerCase() == playerName.toLowerCase();
        });
        if (player.length > 0) {
            var stats;
            if (position == "qb") {
                stats = ["FantasyPoints", "PassingYards", "PassingTDs", "RushingYards"];
            } else if (position == "rb") {
                stats = ["FantasyPoints", "RushingYards", "RushingTDs", "ReceivingYards"];
            } else {
                stats = ["FantasyPoints", "ReceivingYards", "ReceivingTDs", "RushingYards"];
            }
            player = player[0];
            console.log(player);
            setControlPanel(player, changeEvent);
            for (var i = 0; i < stats.length; i++) {
                singleChartCall(player, stats[i], i, position);
            }
        }
    }

    function setControlPanel(player, changeEvent) {
        $("#playername").text("" + player['PlayerName']);
        var min = +player["Year1Year"];
        var max = 0;
        var k = 1;
        
        while (isFinite(+player["Year" + k + "Year"]) && +player["Year" + k + "Year"] > 0) {
            max = +player["Year" + k + "Year"];
            k++;
        }
        $("#yearslider").slider("option", "min", min);
        $("#yearslider").slider("option", "max", max);
        $("#lowvalue").text(min);
        $("#highvalue").text(max);
        if (changeEvent != "yearchange") {
            $("#yearslider").slider("values", 0, min);
            $("#yearslider").slider("values", 1, max);
        }
    }

    function singleChartCall(player, stat, i, position) {
        var data = calculateStat(player, stat, position);
        if (!($("#graph" + stat).length)) {
            $("#graphsarea").append("<div id='graph" + i + "' class='grapharea col-12 col-md-6 col-lg-4'></div>");
        }
        if (i < 1) {
            myChartFirst.width(width).height(height).fixScale(fixScale)
                .fixScaleMinMax(getFixScaleMinMax(stat)).yAxisLabel(getAxisLabel(stat));
            d3.select("#graph" + i).datum(data).call(myChartFirst);
        } else if (i < 2) {
            myChartSecond.width(width).height(height).fixScale(fixScale)
                .fixScaleMinMax(getFixScaleMinMax(stat)).yAxisLabel(getAxisLabel(stat));
            d3.select("#graph" + i).datum(data).call(myChartSecond);
        } else if (i < 3) {
            myChartThird.width(width).height(height).fixScale(fixScale)
                .fixScaleMinMax(getFixScaleMinMax(stat)).yAxisLabel(getAxisLabel(stat));
            d3.select("#graph" + i).datum(data).call(myChartThird);
        } else {
            myChartFourth.width(width).height(height).fixScale(fixScale)
                .fixScaleMinMax(getFixScaleMinMax(stat)).yAxisLabel(getAxisLabel(stat));
            d3.select("#graph" + i).datum(data).call(myChartFourth);
        }
    }

    
    function calculateStat(player, stat, position) {
        var data = [];
        var i = 1;
        while (isFinite(+player["Year" + i + "Year"]) && +player["Year" + i + "Year"] > 0) {
            var year = +player["Year" + i + "Year"];
            var row = [];
            row.push(year);
            var statValue = 0;
            if (stat == "FantasyPoints") {
                if (position == "qb") {
                    statValue = getQBFantasyPoints(player, i);
                } else if (position == "rb") {
                    statValue = getRBFantasyPoints(player, i);
                } else {
                    statValue = getWrTeFantasyPoints(player, i);
                }
            } else {
                statValue = +player["Year" + i + "" + stat].replace(/,/g, '').replace('--', '0');
            }
            if (perGame) {
                var gamesPlayed = +player["Year" + i + "GamesPlayed"].replace('--', '0');
                if (isFinite(gamesPlayed) && gamesPlayed > 0) {
                    statValue = statValue / gamesPlayed;
                }
            }
            row.push(statValue);
            if (year > 0 && year >= yearRange[0] && year <= yearRange[1]) {
                data.push(row);
            }
            i++;
        }
        return data;
    }

    function getAxisLabel(stat) {
        if (stat == "PassingYards") {
            return "Passing Yards";
        } else if (stat == "PassingTDs") {
            return "Passing TDs";
        } else if (stat == "RushingYards") {
            return "Rushing Yards";
        } else if (stat == "FantasyPoints") {
            return "Fantasy Points";
        } else if (stat == "RushingTDs") {
            return "Rushing TDs";
        } else if (stat == "ReceivingYards") {
            return "ReceivingYards";
        } else if (stat == "ReceivingTDs") {
            return "Receiving TDs";
        }
    }

    function getFixScaleMinMax(stat) {
        if (stat == "PassingYards") {
            if (perGame) {
                return [0, 500];
            } else {
                return [0, 5500];
            }
        } else if (stat == "PassingTDs") {
            if (perGame) {
                return [0, 5];
            } else {
                return [0, 56];
            }
        } else if (stat == "RushingYards") {
            if (perGame) {
                return [0, 130];
            } else {
                return [0, 2100];
            }
        } else if (stat == "FantasyPoints") {
            if (perGame) {
                return [0, 30];
            } else {
                return [0, 415];
            }
        } else if (stat == "RushingTDs") {
            if (perGame) {
                return [0, 3];
            } else {
                return [0, 30];
            }
        } else if (stat == "ReceivingYards") {
            if (perGame) {
                return [0, 300];
            } else {
                return [0, 2000];
            }
        } else if (stat == "ReceivingTDs") {
            if (perGame) {
                return [0, 3];
            } else {
                return [0, 23];
            }
        }
    }

    //Function for getting a random int
    function randomDouble(min,max) {
        return Math.random()*(max-min+1)+min;
    }

        //Function for calculating QB's fantasy points
    function getQBFantasyPoints(qb, i) {
        //Points for Passing Yards
        var fantasyPoints = Math.floor(parseInt(qb["Year" + i + "PassingYards"].replace(/,/g, '').replace('--', '0')) / 25);
        //Points for Passing TD's
        fantasyPoints += qb["Year" + i + "PassingTDs"].replace('--', '0') * 4;
        //Points deducted for Passing Int's
        fantasyPoints -= qb["Year" + i + "PassingInts"].replace('--', '0') * 2;
        //Points for Rushing Yards
        fantasyPoints += Math.floor(parseInt(qb["Year" + i + "RushingYards"].replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Rushing TDs
        fantasyPoints += qb["Year" + i + "RushingTDs"].replace('--', '0') * 6;
        //Points deducted for Fumbles Lost
        fantasyPoints -= qb["Year" + i + "FumblesLost"].replace('--', '0') * 2;
        return fantasyPoints;
    }

    //Function for calculating RB's fantasy points
    function getRBFantasyPoints(rb, i) {
        //Points for Rushing Yards
        var fantasyPoints = Math.floor(parseInt(rb["Year" + i + "RushingYards"].replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Rushing TDs
        fantasyPoints += rb["Year" + i + "RushingTDs"].replace('--', '0') * 6;
        //Points for Receiving Yards
        fantasyPoints += Math.floor(parseInt(rb["Year" + i + "ReceivingYards"].replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Receiving TDs
        fantasyPoints += rb["Year" + i + "ReceivingTDs"].replace('--', '0') * 6;
        //Points deducted for Fumbles Lost
        fantasyPoints -= rb["Year" + i + "FumblesLost"].replace('--', '0') * 2;
        return fantasyPoints;
    }

    //Function for calculating WR's and TE's fantasy points
    function getWrTeFantasyPoints(wrTe, i) {
        //Points for Receiving Yards
        var fantasyPoints = Math.floor(parseInt(wrTe["Year" + i + "ReceivingYards"].replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Receiving TDs
        fantasyPoints += wrTe["Year" + i + "ReceivingTDs"].replace('--', '0') * 6;
        //Points for Rushing Yards
        fantasyPoints += Math.floor(parseInt(wrTe["Year" + i + "RushingYards"].replace(/,/g, '').replace('--', '0')) / 10);
        //Points for Rushing TDs
        fantasyPoints += wrTe["Year" + i + "RushingTDs"].replace('--', '0') * 6;
        //Points deducted for Fumbles Lost
        fantasyPoints -= wrTe["Year" + i + "FumblesLost"].replace('--', '0') * 2;
        return fantasyPoints;
    }

})();