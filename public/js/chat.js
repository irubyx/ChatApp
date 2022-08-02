const socket = io()

// server (emit) => client (receive) ==acknowledgement=> server

// client (emit) => server (receive) ==>acknowledgement=> client

// Elements
const $form = document.querySelector("#form")
const $messageFormInput = $form.querySelector("input")
const $messageFormButton = $form.querySelector("button")
const $sendLocation = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMEssageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMEssageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message", (msg) => {
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format("H:mm")
    })
    $messages.insertAdjacentHTML("beforeend", html)

    autoscroll()
})

socket.on("locationMessage", (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("H:mm")
    })
    $messages.insertAdjacentHTML("beforeend", html)

    autoscroll()
})

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$form.addEventListener("submit", (event) => {
    event.preventDefault()

    $messageFormButton.setAttribute("disabled", "disabled")

    const message = event.target.elements.message.value

    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled")
        $messageFormInput.value = ""
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log("Message delivered!")
    })
})

$sendLocation.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.")
    }

    $sendLocation.setAttribute("disabled", "disabled")

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log("Location shared!")
            $sendLocation.removeAttribute("disabled")
        })
    })
})

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})