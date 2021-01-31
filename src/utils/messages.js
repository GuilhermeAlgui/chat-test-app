const generateMessage = (username,text)=>{
    return{
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username,url)=>{
    console.log(username)
    console.log(url)
    return{
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports={
    generateMessage,
    generateLocationMessage
}