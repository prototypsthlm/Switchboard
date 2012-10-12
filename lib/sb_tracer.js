/*
 * Choose environment here:
 */
 	var env = 'all';
/*
 * This default can be overridden for each module.
*/

var config = {
	all: {
		strategy: 'colorConsole',
		setting: {
			level: 0,
			format: "{{title}}: {{message}} ({{file}}:{{line}} {{method}}) {{timestamp}}",
			dateformat: "HH:MM:ss",
		}
	},
	dev: {
		strategy: 'colorConsole',
		setting: {
			level: 2,
			format: "{{title}}: {{message}} ({{file}}:{{line}} {{method}}) {{timestamp}}",
			dateformat: "HH:MM:ss",
		}
	},
	prod: {
		strategy: 'console',
		setting: {
			level: 3,
			format: "{{title}}: {{message}} ({{file}}:{{line}} {{method}}) {{timestamp}}",
			dateformat: "HH:MM:ss"
		}
	}
};

function sbTracer(envName){
	envName = envName || env;
	c = config[envName];
	return require('tracer')[c.strategy](c.setting);
}

module.exports = sbTracer;