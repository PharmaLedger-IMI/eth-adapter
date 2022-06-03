module.exports = function (request, response, next) {

    const anchorID = request.params.anchorId;
    const anchorValue = request.params.anchorValue;

    require("../services/anchoringService").appendAnchor(anchorID, anchorValue, (err, result) => {
        if (err) {
            console.group(`appendAnchor(${anchorID}, ${anchorValue}) ended with Error:`);
            console.log(err);
            console.groupEnd();
            return response.status(428).send("Smart contract invocation failed");
        }
        console.log("appendAnchor ended with success for anchor id: ", anchorID);
        return response.status(200).send(result);
    });
};