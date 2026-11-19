// Get HTML Elements

const studentForm = document.getElementById("studentForm");
const studentContainer = document.getElementById("studentContainer");
const searchInput = document.getElementById("searchInput");

const totalStudents = document.getElementById("totalStudents");
const totalDepartments = document.getElementById("totalDepartments");

const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");

const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("formTitle");


// Load students from LocalStorage

let students = [];

try {
    students = JSON.parse(
        localStorage.getItem("students")
    ) || [];
} catch (error) {
    students = [];
}

let editingId = null;
let selectedPhoto = "";


// Save students permanently in browser storage

function saveStudents() {
    try {
        localStorage.setItem(
            "students",
            JSON.stringify(students)
        );
    } catch (error) {
        alert("Storage is full. Please use a smaller photo.");
        throw error;
    }
}


// Compress uploaded image

function compressImage(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = function () {

            const image = new Image();

            image.onload = function () {

                const canvas = document.createElement("canvas");

                const maxSize = 400;

                let width = image.width;
                let height = image.height;

                if (width > height && width > maxSize) {
                    height = height * maxSize / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = width * maxSize / height;
                    height = maxSize;
                }

                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");

                context.drawImage(image, 0, 0, width, height);

                resolve(
                    canvas.toDataURL("image/jpeg", 0.65)
                );
            };

            image.onerror = reject;
            image.src = reader.result;
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}


// Upload Photo Preview

photoInput.addEventListener("change", async function () {

    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        this.value = "";
        return;
    }

    try {

        selectedPhoto = await compressImage(file);

        photoPreview.src = selectedPhoto;
        photoPreview.style.display = "block";

    } catch (error) {

        alert("Unable to load this photo.");

    }

});


// Safe HTML display

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, function (char) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[char];

    });
}


// Register or Update Student

studentForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const studentId = document.getElementById("studentId").value.trim();
    const rollNo = document.getElementById("rollNo").value.trim();

    const name = document.getElementById("name").value.trim();
    const dob = document.getElementById("dob").value;

    const gender = document.getElementById("gender").value;
    const email = document.getElementById("email").value.trim();

    const phone = document.getElementById("phone").value.trim();

    const department = document.getElementById("department").value;
    const year = document.getElementById("year").value;

    const address = document.getElementById("address").value.trim();


    // Check duplicate ID and Roll Number

    const duplicate = students.some(student => {

        if (student.id === editingId) return false;

        return (
            student.studentId.toLowerCase() === studentId.toLowerCase() ||
            student.rollNo.toLowerCase() === rollNo.toLowerCase()
        );

    });

    if (duplicate) {
        alert("Student ID or Roll Number already exists!");
        return;
    }


    // Check age/date is not in future

    if (dob > new Date().toISOString().split("T")[0]) {
        alert("Date of birth cannot be in the future.");
        return;
    }


    // Create student object

    const student = {

        id: editingId || Date.now(),

        studentId,
        rollNo,
        name,
        dob,
        gender,
        email,
        phone,
        department,
        year,
        address,

        photo: selectedPhoto

    };


    try {

        if (editingId !== null) {

            students = students.map(oldStudent =>
                oldStudent.id === editingId
                    ? student
                    : oldStudent
            );

            alert("Student details updated successfully!");

        } else {

            students.push(student);

            alert("Student registered successfully!");

        }

        saveStudents();

        resetForm();
        displayStudents();

    } catch (error) {

        console.error(error);

    }

});


// Display Students

function displayStudents(searchText = "") {

    studentContainer.innerHTML = "";

    const filteredStudents = students.filter(student => {

        const search = searchText.toLowerCase();

        return (
            student.name.toLowerCase().includes(search) ||
            student.studentId.toLowerCase().includes(search) ||
            student.rollNo.toLowerCase().includes(search) ||
            student.department.toLowerCase().includes(search)
        );

    });


    // Update Dashboard

    totalStudents.textContent = students.length;

    const departments = new Set(
        students.map(student => student.department)
    );

    totalDepartments.textContent = departments.size;


    document.getElementById("emptyMessage").style.display =
        filteredStudents.length === 0 ? "block" : "none";


    // Create Student Cards

    filteredStudents.forEach(student => {

        const card = document.createElement("div");

        card.className = "student-card";

        const safePhoto = student.photo
            ? student.photo
            : "";

        card.innerHTML = `

            <img
                src="${safePhoto || 'https://placehold.co/100x100?text=Student'}"
                class="student-photo"
                alt="Student Photo"
            >

            <h3>${escapeHTML(student.name)}</h3>

            <p><strong>Student ID:</strong> ${escapeHTML(student.studentId)}</p>

            <p><strong>Roll Number:</strong> ${escapeHTML(student.rollNo)}</p>

            <p><strong>Email:</strong> ${escapeHTML(student.email)}</p>

            <p><strong>Phone:</strong> ${escapeHTML(student.phone)}</p>

            <p><strong>Department:</strong> ${escapeHTML(student.department)}</p>

            <p><strong>Year:</strong> ${escapeHTML(student.year)}</p>

            <p><strong>Gender:</strong> ${escapeHTML(student.gender)}</p>

            <p><strong>Date of Birth:</strong> ${escapeHTML(student.dob)}</p>

            <p><strong>Address:</strong> ${escapeHTML(student.address)}</p>

            <div class="student-actions">

                <button class="edit-btn">
                    Edit
                </button>

                <button class="delete-btn">
                    Delete
                </button>

            </div>

        `;


        // Edit Button

        card.querySelector(".edit-btn").addEventListener("click", function () {
            editStudent(student.id);
        });


        // Delete Button

        card.querySelector(".delete-btn").addEventListener("click", function () {
            deleteStudent(student.id);
        });


        studentContainer.appendChild(card);

    });

}


// Edit Student

function editStudent(id) {

    const student = students.find(s => s.id === id);

    if (!student) return;

    editingId = id;

    document.getElementById("studentId").value = student.studentId;

    document.getElementById("rollNo").value = student.rollNo;

    document.getElementById("name").value = student.name;

    document.getElementById("dob").value = student.dob;

    document.getElementById("gender").value = student.gender;

    document.getElementById("email").value = student.email;

    document.getElementById("phone").value = student.phone;

    document.getElementById("department").value = student.department;

    document.getElementById("year").value = student.year;

    document.getElementById("address").value = student.address;

    selectedPhoto = student.photo || "";

    if (selectedPhoto) {

        photoPreview.src = selectedPhoto;
        photoPreview.style.display = "block";

    } else {

        photoPreview.style.display = "none";

    }

    formTitle.textContent = "Update Student Details";

    submitBtn.textContent = "Update Student";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// Delete Student

function deleteStudent(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) return;

    students = students.filter(student => student.id !== id);

    saveStudents();

    displayStudents();

    alert("Student deleted successfully!");

    if (editingId === id) {
        resetForm();
    }

}


// Reset Form

function resetForm() {

    studentForm.reset();

    editingId = null;

    selectedPhoto = "";

    photoPreview.src = "";
    photoPreview.style.display = "none";

    formTitle.textContent = "Student Registration Form";

    submitBtn.textContent = "Register Student";

}


// Clear Button

studentForm.addEventListener("reset", function () {

    setTimeout(resetForm, 0);

});


// Search Students

searchInput.addEventListener("input", function () {

    displayStudents(this.value);

});


// Load Existing Records

displayStudents();