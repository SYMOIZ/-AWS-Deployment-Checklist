(function () {
  "use strict";

  var STORAGE_KEY = "aws-deployment-checklist-v2";

  var DEFAULT_TASKS = [
    {
      id: "mvp",
      title: "Define the smallest useful version of the app",
      hint: "A clear checklist UI with progress — nothing more for the first ship.",
      custom: false
    },
    {
      id: "local-test",
      title: "Build and test the app locally",
      hint: "Confirm checkboxes, progress, add-item, and completion work in your browser.",
      custom: false
    },
    {
      id: "pick-s3",
      title: "Choose Amazon S3 for static hosting",
      hint: "Browser → S3 → HTML/CSS/JS. No backend required for this project.",
      custom: false
    },
    {
      id: "create-bucket",
      title: "Create a uniquely named S3 bucket",
      hint: "Bucket names are global. Include an account id or random suffix.",
      custom: false
    },
    {
      id: "website-hosting",
      title: "Enable static website hosting",
      hint: "Set index.html as the index document for the website endpoint.",
      custom: false
    },
    {
      id: "public-read",
      title: "Allow public read of objects only",
      hint: "Disable block public access for the bucket and add a GetObject policy.",
      custom: false
    },
    {
      id: "upload",
      title: "Upload HTML, CSS, and JavaScript",
      hint: "Use the AWS CLI sync/cp with the correct Content-Type for each file.",
      custom: false
    },
    {
      id: "https-cloudfront",
      title: "Add HTTPS with CloudFront and a TLS certificate",
      hint: "Put CloudFront in front of S3. Use the default CloudFront certificate or ACM for a custom domain.",
      custom: false
    },
    {
      id: "verify-url",
      title: "Open the live HTTPS website URL",
      hint: "Use the CloudFront domain (https://…) returned by AWS — do not invent a URL.",
      custom: false
    },
    {
      id: "live-test",
      title: "Verify the live site end to end",
      hint: "Check that CSS and JS load and that the checklist still works over HTTPS.",
      custom: false
    },
    {
      id: "document",
      title: "Document the deployment in README",
      hint: "Record architecture, tests, and the real live HTTPS URL with no placeholders.",
      custom: false
    }
  ];

  var checklistEl = document.getElementById("checklist");
  var progressPercentEl = document.getElementById("progress-percent");
  var progressFillEl = document.getElementById("progress-fill");
  var progressBarEl = document.getElementById("progress-bar");
  var progressPanelEl = document.querySelector(".progress-panel");
  var completedCountEl = document.getElementById("completed-count");
  var remainingCountEl = document.getElementById("remaining-count");
  var completionEl = document.getElementById("completion");
  var resetBtn = document.getElementById("reset-btn");
  var addForm = document.getElementById("add-form");
  var titleInput = document.getElementById("new-task-title");
  var hintInput = document.getElementById("new-task-hint");

  var tasks = [];
  var checked = {};

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { customTasks: [], checked: {} };
      }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return { customTasks: [], checked: {} };
      }
      return {
        customTasks: Array.isArray(parsed.customTasks) ? parsed.customTasks : [],
        checked: parsed.checked && typeof parsed.checked === "object" ? parsed.checked : {}
      };
    } catch (err) {
      return { customTasks: [], checked: {} };
    }
  }

  function saveStore() {
    var customTasks = [];
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].custom) {
        customTasks.push({
          id: tasks[i].id,
          title: tasks[i].title,
          hint: tasks[i].hint || ""
        });
      }
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          customTasks: customTasks,
          checked: checked
        })
      );
    } catch (err) {
      /* ignore quota / private mode */
    }
  }

  function rebuildTasks(customTasks) {
    tasks = DEFAULT_TASKS.map(function (t) {
      return {
        id: t.id,
        title: t.title,
        hint: t.hint,
        custom: false
      };
    });
    for (var i = 0; i < customTasks.length; i++) {
      var c = customTasks[i];
      if (!c || !c.id || !c.title) {
        continue;
      }
      tasks.push({
        id: String(c.id),
        title: String(c.title),
        hint: c.hint ? String(c.hint) : "Custom checklist item",
        custom: true
      });
    }
  }

  function updateProgress() {
    var total = tasks.length;
    var completed = 0;

    for (var i = 0; i < tasks.length; i++) {
      if (checked[tasks[i].id]) {
        completed += 1;
      }
    }

    var remaining = total - completed;
    var percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressPercentEl.textContent = percent + "%";
    progressFillEl.style.width = percent + "%";
    progressBarEl.setAttribute("aria-valuenow", String(percent));
    completedCountEl.textContent = completed + " completed";
    remainingCountEl.textContent = remaining + " remaining";

    var allDone = completed === total && total > 0;
    completionEl.hidden = !allDone;
    if (progressPanelEl) {
      progressPanelEl.classList.toggle("is-complete", allDone);
    }
  }

  function createItem(task, index) {
    var li = document.createElement("li");
    li.className = "checklist-item" + (checked[task.id] ? " is-done" : "");
    li.dataset.taskId = task.id;

    var number = document.createElement("span");
    number.className = "item-number";
    number.textContent = String(index + 1).padStart(2, "0");
    number.setAttribute("aria-hidden", "true");

    var body = document.createElement("div");
    body.className = "item-body";

    var row = document.createElement("div");
    row.className = "item-row";

    var label = document.createElement("label");
    label.className = "item-label";

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.taskId = task.id;
    checkbox.id = "task-" + task.id;
    checkbox.checked = Boolean(checked[task.id]);
    checkbox.addEventListener("change", function () {
      checked[task.id] = checkbox.checked;
      li.classList.toggle("is-done", checkbox.checked);
      saveStore();
      updateProgress();
    });

    var text = document.createElement("span");
    text.className = "item-text";
    text.textContent = task.title;

    label.appendChild(checkbox);
    label.appendChild(text);
    row.appendChild(label);

    if (task.custom) {
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn btn-remove";
      removeBtn.setAttribute("aria-label", "Remove " + task.title);
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", function () {
        removeTask(task.id);
      });
      row.appendChild(removeBtn);
    }

    var hint = document.createElement("p");
    hint.className = "item-hint";
    hint.textContent = task.hint || "";

    body.appendChild(row);
    body.appendChild(hint);

    li.appendChild(number);
    li.appendChild(body);
    return li;
  }

  function render() {
    checklistEl.innerHTML = "";
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < tasks.length; i++) {
      fragment.appendChild(createItem(tasks[i], i));
    }
    checklistEl.appendChild(fragment);
    updateProgress();
  }

  function removeTask(taskId) {
    tasks = tasks.filter(function (t) {
      return t.id !== taskId;
    });
    delete checked[taskId];
    saveStore();
    render();
  }

  function addTask(title, hint) {
    var cleanTitle = title.replace(/\s+/g, " ").trim();
    if (!cleanTitle) {
      return;
    }
    var cleanHint = (hint || "").replace(/\s+/g, " ").trim();
    var id = "custom-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    tasks.push({
      id: id,
      title: cleanTitle,
      hint: cleanHint || "Custom checklist item",
      custom: true
    });
    checked[id] = false;
    saveStore();
    render();
  }

  function resetChecks() {
    checked = {};
    saveStore();
    render();
  }

  addForm.addEventListener("submit", function (event) {
    event.preventDefault();
    addTask(titleInput.value, hintInput.value);
    titleInput.value = "";
    hintInput.value = "";
    titleInput.focus();
  });

  resetBtn.addEventListener("click", resetChecks);

  var store = loadStore();
  checked = store.checked;
  rebuildTasks(store.customTasks);
  render();
})();
