

// export either WebDracoLoader or NodeDracoLoader depending on the build target


var TargetedDracoLoader = null;

if(__BUILD_TARGET__ == "web") {

    TargetedDracoLoader = require("./webdracoloader.js").WebDracoLoader;
}
else {

    TargetedDracoLoader = require("./nodedracoloader.js").NodeDracoLoader;
}

module.exports = { TargetedDracoLoader };

