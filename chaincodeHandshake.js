'user strict';

const {FileSystemWallet, Gateway, X509WalletMixin} = require('fabric-network');
const fs = require ('fs');
const path = require ('path');

const ccPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccPath, 'utf8');

const ccp = JSON.parse(ccpJSON);

async function main(){
    try{

         //Crea un nuevo CAClient para interactuar con la Fabric CA
         const walletPath = path.join(process.cwd(), 'local_fabric_wallet');
         const wallet = new FileSystemWallet(walletPath);
         console.log( 'Wallet Path:', walletPath);
         
         //Chequear si el usuario ya esta enrrolado
         const userExist = await wallet.exists('admin');
         if(!userExist){
             console.log('No tiene permisos para acceder');
             return;
         }

         //Crea una coneccion al CA 
        const newGateway = new Gateway();
        await newGateway.connect(ccp, {wallet, identity: 'admin', discovery: {enabled: false}});

        const network = await newGateway.getNetwork('mychannel');
        const contractInstance = network.getContract('chaincode4BasicNetwork', 'createCar');
        var result = contractInstance.submitTransaction({Make: "Toyota", Model: "Prius", Colour: "blue", Owner: "Tomoko"});
        console.log('Resultado de la ejecucion del contrato ', result.toString());
        
        await newGateway.disconnect();
    }catch(error){
        console.error('Error al registrar el admin', error);
        process.exit(1);
    }
}

main();