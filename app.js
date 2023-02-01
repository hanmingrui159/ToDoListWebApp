//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require('lodash');

// test lodash
let abc = "ABC";

console.log("------------")
console.log(_.capitalize("ABC"));
console.log("------------")

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const items = [];

const localConnectionString = "mongodb://localhost:27017/todolistDB";
const atlasConnectionString = "mongodb+srv://admin-jason:Test123@cluster0.bdwcdkq.mongodb.net/todolistDB"
mongoose.connect(atlasConnectionString, { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model('Item', itemsSchema);

const itemA = new Item({ name: 'Welcome to your todolist!' });
const itemB = new Item({ name: 'Hit the + button to aff a new item.' });
const itemC = new Item({ name: '<-- Hit this to delete an item.' });

const defaultItems = [itemA, itemB, itemC];

const workItems = [];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          }
          else {
            console.log("variable err is null");
          }
        });
        res.redirect("/");
      }
      else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
      console.log("resulting foundItems is: ", foundItems)
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, results) {
    if (err) {
      console.log(err);
    }
    else {
      if (!results) {
        console.log("Doesn't exist!");
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);
      }
      else {
        console.log("list Found!!!");
        console.log(results);

        res.render("list", { listTitle: results.name, newListItems: results.items });
      }

    }
  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log("list", listName, "clicked POST");


  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    console.log("POST towards custom list");
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function (req, res) {
  console.log("POST /delete has been received")
  console.log(req.body);
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  console.log(checkedItemId);

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (err) {
        console.log("----===========bee pooo");
        console.log(err);
      }
      else {
        console.log("Successfully deleted item");
      }

      res.redirect("/");
    });
  }
  else {
    List.findOneAndUpdate({name: listName}, 
      {
        $pull:
          {items:{_id: checkedItemId}
      }
    }, 
    function removeConnectionsCB(err, obj) {
      if (err) {
        console.log(err);
      }
      else {
        res.redirect("/" + listName);
      }
  });
  }
  

});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
