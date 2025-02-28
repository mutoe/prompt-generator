import React, { useEffect } from "react";
import { ChatCompletionRequestMessage } from "openai";
import { Button, Input } from "@chakra-ui/react";
import NewChat from "@/assets/icons/new-chat.svg";
import TrashcanIcon from "@/assets/icons/trashcan.svg";
import LogoutIcon from "@/assets/icons/logout.svg";
import Image from "next/image";
import content from "@/assets/icons/content.png";
import styled from "@emotion/styled";
import send from "@/assets/icons/send.png";

const ChatInput = styled("input")`
  background: #ffffff;
  border-radius: 8px;
  border: none;
  padding: 0.5rem 1rem;
  width: 768px;
  height: 48px;
  font-size: 1rem;
  font-weight: 500;
  color: #1e1e1e;
  outline: none;
  transition: all 0.2s ease-in-out;

  &:focus {
    box-shadow: 0 0 0 2px #1e1e1e;
  }

  &:focus::placeholder {
    color: #1e1e1e;
  }
`;
const ChatInputWrapper = styled("div")`
  position: absolute;
  bottom: 8px;
  width: 768px;
  height: 48px;
`;
const ChatSendButton = styled("button")`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 4px;
  width: 48px;
  height: 48px;
  background-image: url(${send.src});
  background-size: 24px;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  border: none;
  outline: none;
`;
const ChatsWrapper = styled("div")`
  // good looking scrollbar
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;
type ChatGptAppProp = {
  message?: string;
};

export function ChatGPTApp(props: ChatGptAppProp) {
  const [isLoggedin, setIsLoggedin] = React.useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/chatgpt/verify");
        const data = await response.json();
        setIsLoggedin(data.loggedIn);
      } catch {
        setIsLoggedin(false);
      }
    })();
  }, []);

  const [openAiKey, setOpenAiKey] = React.useState("");

  async function login(key: string) {
    if (key.length === 0) {
      alert("Please enter your OpenAI API key first.");
      return;
    }
    const response = await fetch("/api/chatgpt/user", {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        key: openAiKey,
      }),
    });
    const data = await response.json();
    if (!data.error) {
      setIsLoggedin(true);
    } else {
      setIsLoggedin(false);
    }
  }

  async function logout() {
    const response = await fetch("/api/chatgpt/user", {
      method: "POST",
      body: JSON.stringify({
        action: "logout",
      }),
    });
    const data = await response.json();
    console.log("logout: ", data);
    setIsLoggedin(false);
  }

  const chatsWrapper = React.useRef<HTMLDivElement>(null);
  const [disable, setDisable] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState<ChatCompletionRequestMessage[]>([]);
  const [message, setMessage] = React.useState(props?.message ? props?.message.toString() : "");

  async function sendMessage() {
    if (message.length === 0) {
      alert("Please enter your message first.");
      return;
    }

    try {
      setDisable(true);
      const response = await fetch("/api/chatgpt/chat", {
        method: "POST",
        body: JSON.stringify({
          conversation_name: "chatgpt",
          prompt: message,
        }),
      });
      const data = await response.json();

      if (!data.error) {
        if (data.messages) {
          setChatHistory([...data.messages]);
          setTimeout(() => {
            if (typeof chatsWrapper.current?.scrollTop !== "undefined") {
              // scroll to bottom
              chatsWrapper.current.scrollTop = chatsWrapper.current.scrollHeight;
            }
            setMessage("");
          }, 100);
        }
      } else {
        alert("Error: " + JSON.stringify(data.error));
      }
    } catch (err) {
      console.log(err);
    } finally {
      setDisable(false);
    }
  }

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.code === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault();

        sendMessage();
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, []);

  if (isLoggedin === null) {
    return <></>;
  }

  if (!isLoggedin) {
    return (
      <div className='flex flex-col items-center justify-center h-[85vh]'>
        <h1 className='text-white text-[34px] font-bold'>ChatGPT</h1>
        <p className='text-white text-xl'>You need to login first.</p>

        <div className='my-4 flex w-3/4 gap-2 items-center'>
          <p className='text-white text-xl w-[14rem]'>OpenAI API Key:</p>
          <Input
            className='bg-white text-white'
            value={openAiKey}
            onChange={(ev) => setOpenAiKey(ev.target.value)}
          ></Input>
          <Button
            onClick={async () => {
              await login(openAiKey);
            }}
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-[200px_1fr]'>
      {/* left */}
      <div className='bg-gray-900 text-white p-2 grid grid-rows-[45px_1fr_100px]'>
        <div className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-2 flex-shrink-0 border border-white/20'>
          <NewChat color='white' />
          New chat
        </div>
        <div className='overflow-y-auto overflow-container'></div>
        <div>
          <div className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-2 flex-shrink-0 border border-white/20'>
            <TrashcanIcon color='white' />
            Clear conversations
          </div>
          <div
            className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-2 flex-shrink-0 border border-white/20'
            onClick={logout}
          >
            <LogoutIcon color='white' />
            Log out
          </div>
        </div>
      </div>

      {/* right */}
      <div className='relative flex flex-col items-center justify-start gap-16 h-[85vh] py-4'>
        {chatHistory.length === 0 && <Image className='mt-8' src={content} alt='background image'></Image>}

        {/* chats */}
        <ChatsWrapper ref={chatsWrapper} className='flex flex-col gap-4 w-full px-4 max-h-[70vh] overflow-y-auto'>
          {chatHistory.map((chat, index) => {
            return (
              <div key={index} className='flex flex-col gap-14 '>
                {chat.role === "user" ? (
                  <div className='self-end flex'>
                    {/* chat bubble badge */}
                    <div className='rounded-md bg-green-400 text-white text-xl px-4 py-2 max-w-xl'>{chat.content}</div>
                  </div>
                ) : (
                  <div className='self-start flex'>
                    <p className='rounded-md bg-orange-400 text-white text-xl px-4 py-2 max-w-xl'>{chat.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </ChatsWrapper>

        <ChatInputWrapper>
          <ChatInput
            disabled={disable}
            placeholder='Type your message here...'
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
          />
          <ChatSendButton disabled={disable} onClick={sendMessage} />
        </ChatInputWrapper>
      </div>
    </div>
  );
}
