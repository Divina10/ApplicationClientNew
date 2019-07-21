'user strict';

const {FileSystemWallet, Gateway, X509WalletMixin} = require('fabric-network');
const fs = require ('fs');
const path = require ('path');

const ccPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccPath, 'utf8');

const ccp = JSON.parse(ccpJSON);

async function main(){
    try{
        //Crea el nuevo archivo basado en el manejo de intentidades de la Wallet
        const walletPath = path.join(process.cwd, 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log('wallet path ${walletPath}');

        //Chequear para verificar si el usuario existe
        const userExist = await wallet.exists('user5');
        if(userExist){
            console.log('La identidad para el user5 ya existe en la Wallet');
            return;
        }

        //Chequear si el usuario Admin ya esta enrrolado en la wallet
        const adminExist = await wallet.exists('admin');
        if(!adminExist){
            console.log('La identidad para el usuario admin dentro de la wallet, no existe');
            console.log('Ejecute el script enrollmentAdmin.js');
        }

        //Crea una coneccion al CA 
        const newGateway = new Gateway();
        await newGateway.connect(ccp, {wallet, identity: 'admin', discovery: {enabled: false}});

        //Obtiene el objeto CA Cliente desde el Gateway para interactuar con el peer node
        const ca = newGateway.getClient().getCertificateAuthority();
        const adminIdentity = newGateway.getCurrentIdentity();

        //Registra el usuario, enrola el usuario, e importa la indentidad del usuario en la wallet
        const secret = await ca.register({affiliation: 'org1.deparment1', enrollmentID: 'user5', role: 'client'}, adminIdentity);
        const enrrolment = await ca.enroll({enrollmentID: 'user5', enrollmentSecret: secret});
        const userIdentity = X509WalletMixin.createIdentity('org1MSP', enrrolment.certificate, enrrolment.key.toBytes());
        wallet.import('user5', userIdentity);
        console.log('Se registro, enrolo con exito el user4, y se agrego el certificado a la wallet');

    }catch(error){
        console.error('Fallo al registrar el use5');
        process.exit(1);
    }

}

main();