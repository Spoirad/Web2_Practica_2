const pinataURL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const uploadToPinata = async (fileBuffer, fileName) => {

    let data = new FormData();
    const blob = new Blob([fileBuffer]);
    const metadata = JSON.stringify({
        name: fileName,
    });
    const options = JSON.stringify({
        cidVersion: 0,
    });

    data.append('file', blob, fileName);
    data.append('pinataMetadata', metadata);
    data.append('pinataOptions', options);

    try {
        const pinataApiKey = process.env.PINATA_KEY;
        const pinataSecretApiKey = process.env.PINATA_SECRET;
        const response = await fetch(pinataURL, {
            method: 'POST',
            body: data,
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        });

        const responseData = await response.json();
        //console.log("HASH-Pinata-->", responseData.IpfsHash)  //ESTO ME VACILA SI FUNCIONA PERO DA EL ERROR

        if (!response.ok || !responseData.IpfsHash) {
            console.error("Respuesta errónea de Pinata:", responseData);
            throw new Error(`Pinata falló: ${response.status}`);
        }

        return `https://ipfs.io/ipfs/${responseData.IpfsHash}`;
    } catch (error) {
        console.error('Error uploading to Pinata:', error);
        throw error;
    }
};


module.exports = { uploadToPinata }