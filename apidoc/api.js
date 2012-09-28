YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "BaseConnector",
        "ResultFormatter"
    ],
    "modules": [
        "Connectors",
        "Engine"
    ],
    "allModules": [
        {
            "displayName": "Connectors",
            "name": "Connectors",
            "description": "A Connector works like an interface to third party API's, such as Spotify, Last.fm, Google and more.\nEvery connector exposes methods which can be used to make calls to those API's.\nWhen ready a Connector should always return a ConnectorResponse object containing meta information\nabout the request and response and the result."
        },
        {
            "displayName": "Engine",
            "name": "Engine",
            "description": "Engine takes a json configuration and executes all connectors defined in the config\nin correct order, gathering the result and at the end returning a merged object with\nall results."
        }
    ]
} };
});