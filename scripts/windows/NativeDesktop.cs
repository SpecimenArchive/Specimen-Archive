using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
public static class SpecimenDesktop {
  public static int Width {get;private set;}
  public static int Height {get;private set;}
  public static double Scale {get;private set;}
  [StructLayout(LayoutKind.Sequential)] public struct Rect {public int Left,Top,Right,Bottom;}
  [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] public struct DevMode {
    [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string device;
    public short spec,driver,size,extra; public int fields,x,y,orientation,fixedOutput;
    public short color,duplex,yResolution,ttOption,collate;
    [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string form;
    public short logPixels; public int bits,width,height,flags,frequency,icmMethod,icmIntent,media,dither,reserved1,reserved2,panningWidth,panningHeight;
  }
  [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr value);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern bool EnumDisplaySettings(string name,int mode,ref DevMode value);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int ChangeDisplaySettings(ref DevMode value,int flags);
  [DllImport("user32.dll")] static extern int GetSystemMetrics(int index);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern IntPtr FindWindow(string cls,string title);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h,out Rect rect);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetDpiForWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool MoveWindow(IntPtr h,int x,int y,int width,int height,bool repaint);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h,int command);
  [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr h);
  [DllImport("user32.dll")] static extern bool SetCursorPos(int x,int y);
  [DllImport("user32.dll")] static extern void mouse_event(uint flags,uint dx,uint dy,uint data,UIntPtr extra);
  [DllImport("user32.dll")] static extern void keybd_event(byte key,byte scan,uint flags,UIntPtr extra);
  [DllImport("user32.dll")] static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] static extern bool AttachThreadInput(uint first,uint second,bool attach);
  [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr h,StringBuilder name,int length);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,out uint id);
  delegate bool EnumCallback(IntPtr h,IntPtr data);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumCallback cb,IntPtr data);
  [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern bool SystemParametersInfo(int action,int param,string value,int flags);
  [DllImport("user32.dll")] static extern bool SetSysColors(int count,int[] elements,int[] colors);
  [DllImport("user32.dll")] static extern IntPtr OpenInputDesktop(int flags,bool inherit,int access);
  [DllImport("user32.dll")] static extern bool CloseDesktop(IntPtr desktop);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  static IntPtr Browser(int pid){IntPtr result=IntPtr.Zero;EnumWindows(delegate(IntPtr h,IntPtr _){uint id;GetWindowThreadProcessId(h,out id);var cls=new StringBuilder(128);GetClassName(h,cls,128);Rect r;if(id==pid&&IsWindowVisible(h)&&cls.ToString()=="Chrome_WidgetWin_1"&&GetWindowRect(h,out r)&&r.Right-r.Left>=640&&r.Bottom-r.Top>=360){result=h;return false;}return true;},IntPtr.Zero);if(result==IntPtr.Zero)throw new Exception("Owned Chrome window is unavailable");return result;}
  public static void Initialize(){
    SetProcessDpiAwarenessContext(new IntPtr(-4));
    var dm=new DevMode();dm.size=(short)Marshal.SizeOf(typeof(DevMode));
    if(!EnumDisplaySettings(null,-1,ref dm))throw new Exception("Cannot inspect guest display");
    // Prefer the original station layout where the actual adapter supports it.
    // Some rented UEFI consoles expose only 1280x800. Keep that genuine full
    // display and calibrate its presentation scale separately from sensory input.
    for(int i=0;i<256;i++){var mode=new DevMode();mode.size=(short)Marshal.SizeOf(typeof(DevMode));if(!EnumDisplaySettings(null,i,ref mode))break;if(mode.width==1600&&mode.height==900&&mode.bits==32){if(ChangeDisplaySettings(ref mode,0)!=0)throw new Exception("Cannot select the advertised station display mode");break;}}
    Width=GetSystemMetrics(0);Height=GetSystemMetrics(1);
    if(Width==1600&&Height==900)Scale=2;
    else if(Width==1280&&Height==800)Scale=1.5;
    else throw new Exception("Unsupported VM console display: "+Width+" x "+Height+"; expected 1600x900 or 1280x800");
    SystemParametersInfo(20,0,"",3);SetSysColors(1,new int[]{1},new int[]{0x00363024});
  }
  public static Rect Bounds(int pid){Rect r;GetWindowRect(Browser(pid),out r);return r;}
  public static IntPtr BrowserHandle(int pid){return Browser(pid);}
  public static void TabMenu(int pid,int x,int y){var h=Browser(pid);var r=Bounds(pid);if(GetForegroundWindow()!=h||x<Math.Max(0,r.Left)||x>=Math.Min(Width,r.Right)||y<0||y>r.Top+75)throw new Exception("Tab setup coordinates are outside owned Chrome's tab strip");SetCursorPos(x,y);mouse_event(8,0,0,0,UIntPtr.Zero);mouse_event(16,0,0,0,UIntPtr.Zero);Thread.Sleep(200);}
  public static void Escape(){keybd_event(27,0,0,UIntPtr.Zero);keybd_event(27,0,2,UIntPtr.Zero);}
  public static Rect Taskbar(){var h=FindWindow("Shell_TrayWnd",null);Rect r;if(h==IntPtr.Zero||!IsWindowVisible(h)||!GetWindowRect(h,out r))throw new Exception("Real Windows Explorer taskbar is unavailable");return r;}
  public static void Arrange(int pid){
    var h=Browser(pid);uint unused;var current=GetCurrentThreadId();
    var foreground=GetWindowThreadProcessId(GetForegroundWindow(),out unused);
    var target=GetWindowThreadProcessId(h,out unused);
    bool joinedForeground=false,joinedTarget=false;
    try{
      if(foreground!=0&&foreground!=current)joinedForeground=AttachThreadInput(current,foreground,true);
      if(target!=current&&target!=foreground)joinedTarget=AttachThreadInput(current,target,true);
      ShowWindow(h,3);BringWindowToTop(h);SetForegroundWindow(h);
      // Native tab setup leaves the OS pointer over Chrome's tab strip. Its
      // hover card can cover later captures even after CDP mouse movement.
      if(GetForegroundWindow()==h)SetCursorPos(Width/2,Height/2);
    }finally{
      if(joinedTarget)AttachThreadInput(current,target,false);
      if(joinedForeground)AttachThreadInput(current,foreground,false);
    }
    Thread.Sleep(150);
    if(GetForegroundWindow()!=h)throw new Exception("Windows did not grant foreground focus to owned Chrome during setup");
  }
  public static string Capture(int pid){return CaptureImage(pid,false);}
  public static string Display(int pid){return CaptureImage(pid,true);}
  static string CaptureImage(int pid,bool display){
    var h=Browser(pid);var bar=Taskbar();var r=Bounds(pid);
    var input=OpenInputDesktop(0,false,0x0100);if(input==IntPtr.Zero)throw new Exception("Interactive desktop is locked or disconnected");CloseDesktop(input);
    if(GetForegroundWindow()!=h)throw new Exception("Owned Chrome lost foreground focus; operator recovery required");
    if(GetSystemMetrics(0)!=Width||GetSystemMetrics(1)!=Height||GetSystemMetrics(80)!=1)throw new Exception("Guest display geometry changed after setup");
    if(GetDpiForWindow(h)!=96)throw new Exception("Guest scaling must be 100% (96 DPI)");
    if(bar.Bottom!=Height||bar.Top<Height-64||bar.Top>Height-25||!IsZoomed(h)||r.Bottom>bar.Top+12||r.Left < -12||r.Right>Width+12)throw new Exception("Maximized browser or native taskbar geometry changed");
    using(var bitmap=new Bitmap(Width,Height,PixelFormat.Format32bppArgb))using(var graphics=Graphics.FromImage(bitmap))using(var stream=new MemoryStream()){
      // This method is callable only from the guarded dedicated worker. GDI does
      // not add a hardware cursor: the existing recorded cyan page cursor is one.
      graphics.CopyFromScreen(0,0,0,0,new Size(Width,Height),CopyPixelOperation.SourceCopy);
      bitmap.Save(stream,display?ImageFormat.Jpeg:ImageFormat.Png);return Convert.ToBase64String(stream.ToArray());
    }
  }
}
