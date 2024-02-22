

function loadOptions() {

}

function saveOptions() {
  console.log("saved");

  const status = document.getElementById("save-status");
  if (status?.innerText.includes("saved")) {
    status.innerText += "!";
  } else {
    status.innerText = "saved";
  }
}


document.getElementById("save")?.addEventListener('click', saveOptions);
