'use strict';

const FabricCAService = require ('fabric-ca-client');
const {FileSystemWallet, Gateway, X509WalletMixin} = require('fabric-network');
const fs = require('fs');
const path = require('path');

const ccPath = path.resolve(__dirname, 'connection-org2.json');
const ccpJSON = fs.readFileSync(ccPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

async function main(){

    try{
        //Crea un nuevo CAClient para interactuar con la Fabric CA
        const walletPath = path.join(process.cwd(), 'wallet_first_network_basic');
        const wallet = new FileSystemWallet(walletPath);
        console.log( 'wallet_first_network_basic Path:', walletPath);
        
     

        //Chequear si el usuario ADMIN ya esta enrolado
        const adminExist = await wallet.exists('admin');
        if(!adminExist){
            console.log('La identidad del usuario Admin no existe en la Wallet');
            console.log('Corre este script antes');
        }

        //Crear el gateway para conectarse a Hyperledger (peer node primero)
        const newGateway = new Gateway();
        await newGateway.connect(ccp, {wallet, identity: 'Admin', discovery: {enabled:false}});

        //Obtener el CA client del Gateway para interactuar con el CA
        const ca = newGateway.getClient().getCertificateAuthority();
        const adminIdentity = newGateway.getCurrentIdentity();
        
        //registrar el usuario, enrollar al usuario, e importar la nueva identidad en la wallet
        const secret = await ca.register({
            enrollmentID: 'Admin',
            affiliation: 'org2',  
            role: 'client'
        }, adminIdentity); 
        console.log('Secret --> ', secret);

        //Enrolar el usuario
        const enrollment = await ca.enroll({
            enrollmentID: "Admin",
            enrollmentSecret: secret
          });
        
        //Crea la identidad
        const userIdentity = X509WalletMixin.createIdentity('Org2MSP', enrollment.certificate, enrollment.key.toBytes());
        
        //Importar la identidad en la Wallet
        wallet.import('Admin', userIdentity);
        console.log('registrar el usuario, enrollar al usuario, e importar la nueva identidad en la wallet --> OK!');



    }catch(error){
        console.error('Error al registrar el admin', error);
        process.exit(1);
    }
}

main();