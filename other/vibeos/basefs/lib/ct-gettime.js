var ctgtd = new Date();
const space = " ";
const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// TODO
// add seconds

// Time Functions

exports.getTimeAsString = function(opt) { // Get system time as string. Example: 1:30 PM
    switch(opt) {
        case "NoAMPM": // return as 1:30
            if (ctgtd.getHours() > 12) {
                var gtasnap = ctgtd.getHours() - 12;
            } else {
                var gtasnap = ctgtd.getHours();
            }
            return gtasnap+":"+ctgtd.getMinutes(); 
        case "24Hour": // return as 13:30
            return ctgtd.getHours()+":"+ctgtd.getMinutes();
        default:    // return as 1:30 pm
            if (ctgtd.getHours() > 12) {
                var gtasnap = ctgtd.getHours() - 12;
            } else {
                var gtasnap = ctgtd.getHours();
            }
            return gtasnap+":"+ctgtd.getMinutes()+space+(ctgtd.getHours() > 12 ? 'PM' : 'AM'); 
    }
}

exports.getHourAsInt = function() { // Get hour as integer. (In 12 hour) Example: 1
    if (ctgtd.getHours() > 12) {
        return ctgtd.getHours() - 12;
    } else {
        return ctgtd.getHours();
    }
}

exports.getMinuteAsInt = function() { // Get minute as integer. Example: 30
    return ctgtd.getMinutes()
}

exports.getTimeAsInt = function() { // Get time as integer, will require additional code to parse. Example: 130. [HHMM]
    if (ctgtd.getHours() > 12) {
        return (ctgtd.getHours() - 12).toString() + ctgtd.getMinutes().toString();
    } else {
        return ctgtd.getHours() * 10 + ctgtd.getMinutes();
    }
}

// Date Functions

exports.getDateISO = function(type) {
    switch(type) {
        case "Int": // If request is for integer
            return; // Return WeekDay as Int (1 thru 7)

        case "Str": // If request is for string
            return; // Return weekday as string (Monday,Tuesday,Etc.)

        default: // If request is not int/str then
            return "YOU'RE USING THIS WRONG"; // tell them they're stupid
    }
}

exports.getDateasInt = function(type) {
    switch(type) {
        case "year":
            return ctgtd.getFullYear(); 

        case "month": 
            return ctgtd.getMonth(); 

        case "day": 
            return ctgtd.getDate(); 

        default: // If request is not above option then
            return "YOU'RE USING THIS WRONG"; // tell them they're stupid
    }
}

exports.getWeekDay = function(type) {
    switch(type) {
        case "Int": // If request is for integer
            return ctgtd.getDay(); // Return WeekDay as Int (1 thru 7)

        case "Str": // If request is for string
            return weekdays[ctgtd.getDay()]; // Return weekday as string (Monday,Tuesday,Etc.)

        default: // If request is not int/str then
            return "YOU'RE USING THIS WRONG"; // tell them they're stupid
    }
}

