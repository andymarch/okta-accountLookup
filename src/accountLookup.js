const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const winston = require("winston");
const okta = require('@okta/okta-sdk-nodejs');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});


const baseHandler = async (event) => {
    if(event.pathParameters.email.includes("@")){
        try{
            const client = new okta.Client({
                orgUrl: process.env.TENANT,
                token: process.env.API_TOKEN
            });

            var count = 0;
            var outerUser;
            for await (let user of client.listUsers({q: event.pathParameters.email})) {
                count++
                outerUser = user
            }
           
            var response;
            if(count == 1){
                //if listuser with email returns 1 account return account id
                response = {action: 'proceed', contractid: outerUser.profile.login}
            } else if(count > 1){
                //if listuser with email returns >1 account return prompt
                response = {action: 'prompt'}
            } else {
                //can't find by the email prompt the user for the account id
                //anyway so not to leak info
                response = {action: 'prompt'}
            }
            return {
                statusCode: 200,
                body: JSON.stringify(response)
            }
        } catch(err){
            logger.error("An error occurred", {error: err})
            return {
                statusCode: 500,
                err: JSON.stringify(err)
            }
        }
    }
    else{
        return{
            status: 400,
            error: "Missing parameter."
        }
    }
}

const handler = middy(baseHandler)
.use(cors({
    origins: process.env.ORIGINS.split(' ')
}))

module.exports = {handler}