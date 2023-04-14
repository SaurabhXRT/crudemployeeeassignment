const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const cors = require('cors');
const port = 5000;
const hbs = require("hbs");
const path = require("path");
const multer = require('multer');
const upload = multer();
const mongoose = require("mongoose");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(bodyParser.json());

const template_path = path.join(__dirname, "../templates");
app.set("views", template_path);
app.set("view engine", "hbs");


//mongodb connection
const uri = "mongodb+srv://saurabhbabu287:RdoC8AJYy7iNzW52@cluster0.jg5mpmq.mongodb.net/?retryWrites=true&w=majority"
mongoose.set('strictQuery',false);
const db = mongoose.connection;
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  
    console.log("we are connnetcted..");
});

//schema
const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  contacts: {
    type: [{
      type: {
        type: String,
        required: true
      },
      value: {
        type: String,
        required: true
      }
    }],
    required: true
  }
});

const Employee = mongoose.model('Employee', employeeSchema);


app.post('/employees', upload.none(), async (req, res) => {
  try {
    const employee = new Employee({
      name: req.body.name,
      department: req.body.department,
      contacts: req.body.contacts
    });
    console.log(req.body.contacts);
    await employee.save();
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});
app.get('/', async (req, res) => {
  try{
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;
  const employees = await Employee.find().skip(offset).limit(limit);
  const count = await Employee.countDocuments();
  const totalPages = Math.ceil(count / limit);
  const hasPrevPage = page > 1;
  const prevPage = page - 1;
  const hasNextPage = page < totalPages;
  const nextPage = page + 1;

  res.render('employee',
        { employees, 
          count, 
          page, 
          limit, 
          totalPages, 
          hasPrevPage, 
          prevPage, 
          hasNextPage, 
          nextPage 
        });
  } catch(err){
    res.send(err);
  }
});


app.get("/search", async (req, res) => {
  try {
    const query = req.query.searchquery;

    const employees = await Employee.find(
      { name: { $regex: query, $options: "i" } },
      { name: 1, department: 1, contacts: 1 }
    );
    
    res.render("employee", {  employees });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});



// DELETE an employee
app.post('/employees/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).send();
    }
    res.redirect('/');
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/employees/:id/edit", async(req,res) =>{
  const employee = await Employee.findById(req.params.id);
  

  res.render("edit", { employee});
})


// Update an existing employee
app.post('/employees/update/:id', upload.none(), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).send('Employee not found');
    }
    employee.name = req.body.name;
    employee.department = req.body.department;
    employee.contacts = req.body.contacts;

    await employee.save();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get("/", (req,res) =>{
   res.render("employee");
})
app.listen(port, () =>{
    console.log("server is running");
});
