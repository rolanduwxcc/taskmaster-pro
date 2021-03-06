var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

//-----------------------------------------------------task text/p was clicked turned to textarea
$(".list-group").on("click", "p", function() {
  var text = $(this)
    .text()
    .trim();
  
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text)

  $(this).replaceWith(textInput);

  textInput.trigger("focus");
});

//--------------------------------------------------------blur callback left textarea back to p
$(".list-group").on("blur", "textarea", function() {
  //get teh text area's current value/text
  var text = $(this)
    .val()
    .trim();

  //get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  //get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // console.log(text + "|" + status + "|" + index);

  tasks[status][index].text = text;
  saveTasks();

  //recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);
    
  //replace text area with p element
  $(this).replaceWith(taskP);
});

//--------------------------------------------------------task date is clicked
$(".list-group").on("click", "span", function() {
  //get current date text
  var taskDate = $(this).text().trim();

  //create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(taskDate);

  //swap out elements
  $(this).replaceWith(dateInput);

  //enable jquery ui datepicker
  dateInput.datepicker({
    minDate: -10,
    gotoCurrrent: true,
    showButtonPanel: true,
    showAnim: "fade",
    onClose: function() {
      //when calendar is closed force a change event on the dateInput
      $(this).trigger("change");
    }
  })

  //automatically focus on new element
  dateInput.trigger("focus");
});

//--------------------------------------------------------date CHANGE fka blur callback left date field return to normal
$(".list-group").on("change", "input[type='text']", function() {
  //get current text
  var taskDate = $(this).val();

  //get status and position in the list
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-","");
  var index = $(this)
    .closest(".list-group-item")
    .index();

  //update task in array and re-save to localstorage
  tasks[status][index].date = taskDate;
  saveTasks();

  //recreate span element with boostrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);

  //replace input with span element
  $(this).replaceWith(taskSpan);

  //pass the task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

//--------------------------------------------------------sortable
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  help: "clone",
  activate: function(event) {
    console.log("activate", this);
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    console.log("deactivate", this);
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    console.log("over", event.target);
    $(event.target).addClass("dropover-active");
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event) {
    console.log("out", event.target);
    $(event.target).removeClass("dropover-active");
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  drop: function(event) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  update: function(event) {
    var tempArray = []; 
    // console.log("update", this);
    // console.log($(this).children());
    $(this).children().each(function() {

      var text = $(this)
      .find("p")
      .text()
      .trim();

      var date = $(this)
      .find("span")
      .text()
      .trim();

      tempArray.push({
        text: text,
        date: date
      });
    });
    //trim down list's ID to match object property
    var arrayName = $(this)
    .attr("id")
    .replace("list-", "");

    //update array on tasks object and save
    tasks[arrayName] = tempArray;
    saveTasks();

  }
});

//--------------------------------------------------------TRASH
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    console.log("drop",ui);
    ui.draggable.remove();
  },
  over: function(event, ui) {
    console.log("over");
  },
  out: function(event, ui) {
    console.log("out");
  }
});

$("#modalDueDate").datepicker({
  minDate: -10,
  gotoCurrrent: true,
  showButtonPanel: true,
  showAnim: "fade",
  // showOn: "both",
  // buttonImageOnly: true,
  // buttonImage: "calendar.gif",
  // buttonText: "Calendar!"
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

var auditTask = function(taskEl) {
  // console.log(taskEl);
  //get date from task element
  var date = $(taskEl).find("span").text().trim();

  //convert to moment object at 5pm
  var time = moment(date, "L").set("hour", 17);
  //this should print out an object for the value of the date variable but at 5pm (military time is 1700 hours).

  //remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  //apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

//this thing right here is good example of how traverse the DOM and get the element you want
//to mess with 
setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, (1000 * 60) * 30);

// load tasks for the first time
loadTasks();


