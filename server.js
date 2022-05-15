import express from 'express';
import bcrypt from 'bcrypt-nodejs'
import cors from 'cors'
import knex from 'knex'
import { response } from 'express';

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : 'test',
      database : 'smart-brain'
    }
  });



const app = express();
app.use(express.json())

// const database = {
//     users: [
//         {
//             id: "123",
//             name: "John",
//             password : "cookies",
//             email: "john@gmail.com",
//             entries : 0,
//             joined: new Date()
//         },
//         {
//             id: '124',
//             name: "Sally",
//             password: "bananas",
//             email: "sally@gmail.com",
//             entries : 0,
//             joined: new Date()
//         },
//         {
//             id: '125',
//             name: "Rendy",
//             email: "rendy@gmail.com",
//             entries : 0,
//             joined: new Date()
//         }
//     ],
//     login: [
//         {
//             id: '987',
//             hash: '',
//             email: 'john@gmail.com'
//         }
//     ]
// }

app.use(cors())

app.get('/', (req, res) =>{
    res.send('it is working')
})

app.post('/signin', (req, res) =>{
    // if(req.body
    // res.json('this is sigin')
    // res.json(req.body.email)
    // bcrypt.compare("apples", '$2a$10$NEz5unpi40mSdI94cVrtceRhlSyJkurZiJyELmd7UaSBSgn96Cdmq', function(err, res) {
    //     // res == true
    //     console.log('first ', res)
    // });
    // bcrypt.compare("veggies", '$2a$10$NEz5unpi40mSdI94cVrtceRhlSyJkurZiJyELmd7UaSBSgn96Cdmq', function(err, res) {
    //     // res = false
    //     console.log('second ', res)
    // });
    // if (req.body.email === database.users[0].email
    //     && req.body.password === 
    //     database.users[0].password){
    //         console.log("masuk")
    //         res.json(database.users[0])
    //     }
    // else{
    //     res.status(400).json('error loggin in')
    
    // }
    if (!req.body.email || !req.body.password) {
        return res.status(400).json('incorrect form submission');
    }


    db.select('email', 'hash').from('login')
    .where('email', '=' , req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash );
        if (isValid){
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user =>{
                res.json(user[0])

            })
            .catch(err => res.status(400).json('unable to get user'))
        }
        else{
            res.status(400).json('wrong credentials')
        }

    })
    .catch(err => res.status(400).json('wrong credentials'))

})

app.post('/register', (req,res) =>{
    const { email, name , password} = req.body;
    // bcrypt.hash(password, null, null, function(err, hash) {
    //     console.log(hash);
    // });  
    if (!email || !name || !password) {
        return res.status(400).json('incorrect form submission');
      }
    const hash = bcrypt.hashSync(password);


        db.transaction(trx =>{
            trx.insert({
                hash: hash,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail =>{
                return trx('users')
                .returning('*')
                .insert({
                    // title: 'Slaughterhouse Five'
                    email: loginEmail[0].email,
                    name: name,
                    joined: new Date()
                }).then(response =>{
                    res.json(response[0]);
        
                })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(400).json('unable to regist'))

    // database.users.push({
    //     id: "126",
    //     name: name,
    //     email: email,
    //     password: password,
    //     entries : 0,
    //     joined: new Date()
    // })
    // res.json(database.users[database.users.length-1])
})

app.get('/profile/:id', (req, res) => {
    // let found = false;
    const { id } = req.params;
    db.select('*').from('users').where({
        id: id
    })
    .then(user =>{
        if(user.length){
            res.json(user[0])
        }
        else{
            res.status(400).json('not found')
        }
        
    })
    .catch(err => {
        res.status(400).json('error getting user')
    })

})


app.put('/image', (req,res) =>{
    let found = false;
    const { id } = req.body;
    // res.json(id)
    // database.users.forEach(user =>{
    //     if (user.id === id){
    //         found = true;
    //         user.entries++
    //         return res.json(user.entries);
            
    //     }
    // })
    // if(!found){
    //     res.status(400).json('not found')
    // }
    db('users')
    .where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries)
    })
    .catch(err => {
        res.status(400).json('unable to get entries')
    })



})








app.listen(process.env.PORT || 8080, () => {
    console.log(`app is running on port ${process.env.PORT}`)
})

// console.log(process.env)

