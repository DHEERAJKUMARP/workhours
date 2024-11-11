const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

const dataFilePath = path.join(__dirname, "data.json");
// Serve static files from the "public" folder
app.use(express.static('public'));  // Assuming the frontend files are in a "public" folder

// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(express.static('public'));  // Serve static files (your frontend files)

// Helper function to ensure data.json exists
const ensureDataFileExists = () => {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([])); // Initialize with an empty array if file doesn't exist
  }
};

// Route to get the data
app.get("/getData", (req, res) => {
  ensureDataFileExists(); // Ensure the data file exists before reading
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Unable to read data file." });
    }
    res.json(JSON.parse(data || "[]")); // Parse the data (or empty array if no data)
  });
});

// Route to add a new entry
app.post("/addEntry", (req, res) => {
  const newEntry = req.body;
  console.log("New Entry:", newEntry); // Log the entry for debugging

  ensureDataFileExists(); // Ensure the data file exists before reading

  // Read the existing data
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Unable to read data file." });
    }

    let dataJson = JSON.parse(data || "[]");
    dataJson.push(newEntry);

    // Write the updated data back to the file
    fs.writeFile(dataFilePath, JSON.stringify(dataJson, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: "Unable to write data file." });
      }
      res.json({ success: true, message: "Entry added successfully!" });
    });
  });
});

// Route to update an existing entry
app.put("/updateEntry/:date", (req, res) => {
  const updatedEntry = req.body;
  const { date } = req.params;

  ensureDataFileExists(); // Ensure the data file exists before reading

  // Read the existing data
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Unable to read data file." });
    }

    let dataJson = JSON.parse(data || "[]");
    const entryIndex = dataJson.findIndex((entry) => entry.date === date);

    if (entryIndex === -1) {
      return res.status(404).json({ error: "Entry not found." });
    }

    // Update the entry
    dataJson[entryIndex] = { ...dataJson[entryIndex], ...updatedEntry };

    // Write the updated data back to the file
    fs.writeFile(dataFilePath, JSON.stringify(dataJson, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: "Unable to write data file." });
      }
      res.json({ success: true, message: "Entry updated successfully!" });
    });
  });
});

// Route to delete an entry
app.delete("/deleteEntry/:date", (req, res) => {
  const { date } = req.params;

  ensureDataFileExists(); // Ensure the data file exists before reading

  // Read the existing data
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Unable to read data file." });
    }

    let dataJson = JSON.parse(data || "[]");
    dataJson = dataJson.filter((entry) => entry.date !== date);

    // Write the updated data back to the file
    fs.writeFile(dataFilePath, JSON.stringify(dataJson, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: "Unable to write data file." });
      }
      res.json({ success: true, message: "Entry deleted successfully!" });
    });
  });
});
// Edit entry
function editEntry(date) {
  fetch(`/getData`)
    .then(response => response.json())
    .then(data => {
      const entry = data.find(item => item.date === date);
      if (entry) {
        // Populate the form with entry data
        document.getElementById("date").value = entry.date;
        document.getElementById("checkInTime").value = entry.checkInTime;
        document.getElementById("checkOutTime").value = entry.checkOutTime;
        document.getElementById("leaveType").value = entry.leaveType;
        document.getElementById("notes").value = entry.notes;
        document.getElementById("isCompOffDay").checked = entry.isCompOffDay;
        document.getElementById("linkedMissedDay").value = entry.linkedMissedDay || "";

        // Modify the form submit button behavior for update
        document.getElementById("timeForm").onsubmit = function(e) {
          e.preventDefault();
          const updatedEntry = {
            date,
            checkInTime: document.getElementById("checkInTime").value,
            checkOutTime: document.getElementById("checkOutTime").value,
            leaveType: document.getElementById("leaveType").value,
            notes: document.getElementById("notes").value,
            isCompOffDay: document.getElementById("isCompOffDay").checked,
            linkedMissedDay: document.getElementById("linkedMissedDay").value,
          };
          fetch(`/updateEntry/${date}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedEntry),
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              alert("Entry updated successfully!");
              loadEntries();
            } else {
              alert("Failed to update entry!");
            }
          });
        };
      }
    });
}

// Delete entry
function deleteEntry(date) {
  if (confirm("Are you sure you want to delete this entry?")) {
    fetch(`/deleteEntry/${date}`, {
      method: "DELETE",
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert("Entry deleted successfully!");
        loadEntries();
      } else {
        alert("Failed to delete entry!");
      }
    });
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
