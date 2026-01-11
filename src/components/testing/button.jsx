export default function MyApp() {
  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton />
      <Image/>
    </div>
  );
}

function MyButton() {

  function handleClick(){
    alert('You clicked me!');
  }

  return (<>
    <button onClick={handleClick}>
      I'm a button,Click Me
    </button><br /><br />
    </>
  );
}

function Image() {
  return (<>
    <img src="/src/components/testing/boy.avif" className="rounded-2xl w-[200px]" alt="boy" />
    </>
  );
}